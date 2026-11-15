"""스텁 엔진 - OpenAI 키·Atlas 없이 전체 흐름을 먼저 완성하기 위한 가짜 구현

- 임베딩 대신 "글자 2개 묶음(2-gram)이 얼마나 겹치는지"로 점수를 매깁니다.
- 서버 메모리에 저장합니다 → FastAPI 를 재시작하면 사라짐 → [전체 재색인]으로 복구.
- 의미는 모릅니다: "모여요"와 "모임"을 다른 말로 봅니다. (Atlas 엔진은 의미로 찾음)
"""
import re
import threading

from ..chunking import make_splitter, split_post
from ..config import Settings
from ..schemas import IndexRequest
from .base import Hit

_NON_WORD = re.compile(r"[^0-9a-zA-Z가-힣]")
# 질문에 흔히 붙는 말 (재작성할 때 떼어 냄)
_QUESTION_ENDINGS = re.compile(
    r"(은|는|이|가|을|를|에|에서|요|나요|하나요|인가요|있나요|되나요|할까요|해요|어때|뭐야|알려줘|언제야|어떻게|무엇|뭔가요)$"
)


def bigrams(text: str) -> set[str]:
    s = _NON_WORD.sub("", text.lower())
    return {s[i:i + 2] for i in range(len(s) - 1)} if len(s) > 1 else ({s} if s else set())


def overlap_score(query: str, text: str) -> float:
    q = bigrams(query)
    return len(q & bigrams(text)) / len(q) if q else 0.0


class StubEngine:
    name = "stub"

    def __init__(self, settings: Settings):
        self.min_score = settings.stub_min_score
        self.splitter = make_splitter(settings.chunk_size, settings.chunk_overlap)
        self._chunks: list[Hit] = []
        self._lock = threading.Lock()

    def index(self, req: IndexRequest) -> int:
        texts = split_post(self.splitter, req.title, req.content)
        new = [Hit(req.board_id, req.title, req.owner, req.owner_name, t, 0.0) for t in texts]
        with self._lock:
            self._chunks = [c for c in self._chunks if c.board_id != req.board_id] + new   # 기존 청크 교체
        return len(new)

    def delete(self, board_id: int) -> int:
        with self._lock:
            before = len(self._chunks)
            self._chunks = [c for c in self._chunks if c.board_id != board_id]
            return before - len(self._chunks)

    def search(self, query: str, allowed_ids: list[int], k: int) -> list[Hit]:
        allowed = set(allowed_ids)
        if not allowed:
            return []                                    # 허용목록이 비면 아무것도 찾지 않음
        with self._lock:
            scored = [
                Hit(c.board_id, c.title, c.owner, c.owner_name, c.text, round(overlap_score(query, c.text), 3))
                for c in self._chunks if c.board_id in allowed
            ]
        scored.sort(key=lambda h: h.score, reverse=True)
        return scored[:k]

    def generate(self, question: str, hits: list[Hit]) -> str:
        # LLM 대신 "질문과 가장 많이 겹치는 문장"을 골라 출처 번호를 붙임
        best_sentence, best_id, best = "", hits[0].board_id, -1.0
        for h in hits:
            body = h.text.split("\n", 1)[1] if h.text.startswith("제목:") and "\n" in h.text else h.text
            for sentence in re.split(r"(?<=[.!?다])\s+|\n", body):
                sentence = sentence.strip()
                if len(sentence) < 4:
                    continue
                score = overlap_score(question, sentence)
                if score > best:
                    best_sentence, best_id, best = sentence, h.board_id, score
        return f"{best_sentence} [#{best_id}]"

    def rewrite(self, question: str) -> str:
        # 물음표·조사·어미를 떼어 핵심 단어만 남김 (LLM 재작성의 흉내)
        words = [_QUESTION_ENDINGS.sub("", w) for w in _NON_WORD.sub(" ", question).split()]
        keywords = [w for w in words if len(w) >= 2]
        return " ".join(keywords) or question

    def count(self) -> int:
        return len(self._chunks)

    def close(self) -> None:
        pass
