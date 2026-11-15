"""청크 분할

글 전체를 벡터 하나로 만들면 의미가 흐려집니다. 문단 단위로 잘라야 질문과 맞는 부분을 찾을 수 있습니다.
겹침(overlap)을 두면 문장이 경계에서 잘려도 앞뒤 청크 어딘가에 온전히 남습니다.
각 청크 앞에 "제목:" 줄을 붙여 어떤 글의 조각인지 남깁니다.
"""
from langchain_text_splitters import RecursiveCharacterTextSplitter


def make_splitter(chunk_size: int, chunk_overlap: int) -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", "다. ", " ", ""],   # 문단 → 줄 → 문장 → 단어 순으로 자름
    )


def split_post(splitter: RecursiveCharacterTextSplitter, title: str, content: str) -> list[str]:
    pieces = splitter.split_text(content.strip()) or [content.strip()]
    return [f"제목: {title}\n{piece}" for piece in pieces]
