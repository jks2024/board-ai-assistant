"""Atlas 엔진 - OpenAI 임베딩 + MongoDB Atlas Vector Search (LangChain 부품 조립)

색인 : 분할 → OpenAIEmbeddings(1536차원) → MongoDBAtlasVectorSearch.add_texts (메타데이터 boardId·owner)
검색 : 같은 임베딩 모델로 질문을 벡터화 → pre_filter {"boardId": {"$in": 허용목록}} 안에서 top-k
생성 : ChatPromptTemplate → ChatOpenAI → StrOutputParser 체인
"""
import logging

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from pymongo import MongoClient

from ..chunking import make_splitter, split_post
from ..config import Settings
from ..schemas import IndexRequest
from .base import Hit

log = logging.getLogger(__name__)

ANSWER_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "너는 우리 반 게시판의 AI 도우미다. 아래 [근거]에 있는 내용만 사용해 한국어로 간결하게 답한다.\n"
     "- 문장 끝에 근거 글 번호를 [#번호] 형식으로 붙인다. 예: 매주 목요일에 모입니다 [#1]\n"
     "- 근거에 없는 내용은 지어내지 말고 '게시판에서 확인되지 않습니다'라고 말한다.\n"
     "- 3~5문장 이내로 답한다."),
    ("human", "[근거]\n{context}\n\n[질문]\n{question}"),
])

REWRITE_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "사용자의 질문을 게시판 검색에 알맞은 짧은 검색 문장으로 바꾼다. "
     "핵심 명사와 키워드만 남기고, 설명 없이 바꾼 문장 한 줄만 출력한다."),
    ("human", "{question}"),
])


class AtlasEngine:
    name = "atlas"

    def __init__(self, settings: Settings):
        if not settings.openai_api_key or not settings.mongodb_uri:
            raise RuntimeError("RAG_ENGINE=atlas 에는 OPENAI_API_KEY 와 MONGODB_URI 가 필요합니다.")
        self.min_score = settings.min_score
        self.splitter = make_splitter(settings.chunk_size, settings.chunk_overlap)

        self.client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=8000)  # lifespan 에서 close
        self.collection = self.client[settings.mongodb_db][settings.mongodb_collection]
        embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            dimensions=settings.embedding_dimensions,   # Atlas 인덱스 numDimensions 와 같아야 함
            api_key=settings.openai_api_key,
        )
        self.store = MongoDBAtlasVectorSearch(
            collection=self.collection,
            embedding=embeddings,
            index_name=settings.atlas_index_name,
            text_key="text",
            embedding_key="embedding",
            relevance_score_fn="cosine",
        )
        llm = ChatOpenAI(model=settings.chat_model, temperature=0, api_key=settings.openai_api_key)
        self.answer_chain = ANSWER_PROMPT | llm | StrOutputParser()     # 프롬프트 → 모델 → 파서
        self.rewrite_chain = REWRITE_PROMPT | llm | StrOutputParser()

    def index(self, req: IndexRequest) -> int:
        texts = split_post(self.splitter, req.title, req.content)
        metadatas = [
            {"boardId": req.board_id, "title": req.title, "owner": req.owner, "ownerName": req.owner_name}
            for _ in texts
        ]
        self.delete(req.board_id)                  # 수정이면 기존 청크 교체
        self.store.add_texts(texts, metadatas=metadatas)
        return len(texts)

    def delete(self, board_id: int) -> int:
        return self.collection.delete_many({"boardId": board_id}).deleted_count

    def search(self, query: str, allowed_ids: list[int], k: int) -> list[Hit]:
        if not allowed_ids:
            return []
        # 허용목록은 검색 "단계"에서 적용 (Atlas 인덱스에 filter 필드 boardId 가 있어야 함)
        results = self.store.similarity_search_with_score(
            query, k=k, pre_filter={"boardId": {"$in": allowed_ids}}
        )
        return [
            Hit(
                board_id=int(doc.metadata["boardId"]),
                title=doc.metadata.get("title", ""),
                owner=doc.metadata.get("owner", ""),
                owner_name=doc.metadata.get("ownerName"),
                text=doc.page_content,
                score=round(float(score), 3),
            )
            for doc, score in results
        ]

    def generate(self, question: str, hits: list[Hit]) -> str:
        context = "\n\n".join(f"[#{h.board_id}] {h.text}" for h in hits)
        return self.answer_chain.invoke({"context": context, "question": question}).strip()

    def rewrite(self, question: str) -> str:
        return self.rewrite_chain.invoke({"question": question}).strip() or question

    def count(self) -> int:
        return self.collection.estimated_document_count()

    def close(self) -> None:
        self.client.close()
