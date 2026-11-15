"""엔진 인터페이스 - 그래프가 아는 것은 이 약속(index · search · generate · rewrite)뿐입니다."""
from dataclasses import dataclass
from typing import Protocol

from ..schemas import IndexRequest


@dataclass
class Hit:
    board_id: int
    title: str
    owner: str
    owner_name: str | None
    text: str          # 청크 본문 ("제목: ..." 줄 포함)
    score: float       # 0~1, 클수록 질문과 비슷


class Engine(Protocol):
    name: str
    min_score: float   # 이 점수 이상이어야 근거로 인정 (grade 노드에서 사용)

    def index(self, req: IndexRequest) -> int: ...            # 저장한 청크 수
    def delete(self, board_id: int) -> int: ...              # 지운 청크 수
    def search(self, query: str, allowed_ids: list[int], k: int) -> list[Hit]: ...
    def generate(self, question: str, hits: list[Hit]) -> str: ...
    def rewrite(self, question: str) -> str: ...
    def count(self) -> int: ...
    def close(self) -> None: ...
