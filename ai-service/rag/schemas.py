"""요청·응답 계약 (Pydantic)

Java(Spring)는 boardId 처럼 camelCase, Python 은 board_id 처럼 snake_case 를 씁니다.
CamelModel 의 alias_generator 가 둘을 이어 줍니다.
  - 들어오는 JSON : {"boardId": 1}  → 파이썬 속성 board_id
  - 나가는 JSON   : board_id        → {"boardId": 1}
"""
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class IndexRequest(CamelModel):
    board_id: int = Field(gt=0, description="게시글 번호")
    title: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1, max_length=20000)
    owner: str = Field(min_length=1, description="작성자 이메일 (권한 필터용)")
    owner_name: str | None = None


class IndexResponse(CamelModel):
    board_id: int
    chunks: int


class DeleteResponse(CamelModel):
    board_id: int
    deleted: int


class ChatRequest(CamelModel):
    question: str = Field(min_length=1, max_length=500)
    allowed_board_ids: list[int] = Field(default_factory=list, description="Spring 이 만든 READY 허용목록")


class Source(CamelModel):
    board_id: int
    title: str
    owner_name: str | None = None
    score: float
    snippet: str


class ChatResponse(CamelModel):
    answer: str
    abstained: bool
    final_query: str
    sources: list[Source]
    trace: list[str]


class HealthResponse(CamelModel):
    status: str
    engine: str
    chunks: int
