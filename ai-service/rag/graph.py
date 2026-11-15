"""LangGraph RAG 그래프 - 근거가 없으면 한 번 더 찾고, 그래도 없으면 답하지 않는다

  START → retrieve → grade ─┬─ 근거 있음 ─────────────→ generate ─┐
             ▲               ├─ 없음 · 재시도 남음 → rewrite ─┐    ├→ format → END
             └───────────────┼──────────────────────────────┘    │
                             └─ 없음 · 재시도 끝 ────→ abstain ──┘
"""
import operator
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph

from .engines import Engine, Hit

ABSTAIN_MESSAGE = "게시판에서 관련 내용을 찾지 못했습니다. 질문을 바꾸거나 관련 글이 있는지 확인해 주세요."


class RagState(TypedDict, total=False):
    question: str                  # 사용자 원래 질문
    query: str                     # 실제 검색에 쓰는 질문 (재작성되면 바뀜)
    allowed_ids: list[int]         # Spring 이 보낸 READY 허용목록
    hits: list[Hit]                # 검색 결과
    relevant: list[Hit]            # 기준 점수를 넘은 근거
    rewrites: int                  # 재작성 횟수
    answer: str
    abstained: bool
    sources: list[dict]
    trace: Annotated[list[str], operator.add]   # 리듀서: 덮어쓰지 않고 이어 붙임


def build_graph(engine: Engine, top_k: int = 4, max_rewrites: int = 1):
    # ── 노드: 상태를 받아 "바꿀 값만" 돌려줍니다 ──
    def retrieve(state: RagState) -> dict:
        hits = engine.search(state["query"], state.get("allowed_ids", []), top_k)
        return {"hits": hits, "trace": ["retrieve"]}

    def grade(state: RagState) -> dict:
        relevant = [h for h in state.get("hits", []) if h.score >= engine.min_score]
        return {"relevant": relevant, "trace": ["grade"]}

    def rewrite(state: RagState) -> dict:
        return {
            "query": engine.rewrite(state["question"]),
            "rewrites": state.get("rewrites", 0) + 1,
            "trace": ["rewrite"],
        }

    def generate(state: RagState) -> dict:
        return {"answer": engine.generate(state["question"], state["relevant"]),
                "abstained": False, "trace": ["generate"]}

    def abstain(state: RagState) -> dict:
        return {"answer": ABSTAIN_MESSAGE, "abstained": True, "relevant": [], "trace": ["abstain"]}

    def format_sources(state: RagState) -> dict:
        best: dict[int, Hit] = {}
        for h in state.get("relevant", []):                     # 같은 글의 청크는 점수가 높은 것 하나만
            if h.board_id not in best or h.score > best[h.board_id].score:
                best[h.board_id] = h
        sources = [
            {
                "board_id": h.board_id,
                "title": h.title,
                "owner_name": h.owner_name,
                "score": h.score,
                "snippet": (h.text.split("\n", 1)[-1])[:160],
            }
            for h in sorted(best.values(), key=lambda x: x.score, reverse=True)
        ]
        return {"sources": sources, "trace": ["format"]}

    # ── 조건부 간선: 상태를 보고 다음 노드를 고름 ──
    def route_after_grade(state: RagState) -> str:
        if state.get("relevant"):
            return "generate"
        if state.get("rewrites", 0) < max_rewrites:   # 종료 조건은 그래프의 책임 (없으면 무한 루프)
            return "rewrite"
        return "abstain"

    g = StateGraph(RagState)
    g.add_node("retrieve", retrieve)
    g.add_node("grade", grade)
    g.add_node("rewrite", rewrite)
    g.add_node("generate", generate)
    g.add_node("abstain", abstain)
    g.add_node("format", format_sources)

    g.add_edge(START, "retrieve")
    g.add_edge("retrieve", "grade")
    g.add_conditional_edges("grade", route_after_grade,
                            {"generate": "generate", "rewrite": "rewrite", "abstain": "abstain"})
    g.add_edge("rewrite", "retrieve")               # 루프
    g.add_edge("generate", "format")
    g.add_edge("abstain", "format")
    g.add_edge("format", END)
    return g.compile()


def run_graph(graph, question: str, allowed_ids: list[int]) -> RagState:
    initial: RagState = {"question": question, "query": question, "allowed_ids": allowed_ids,
                         "rewrites": 0, "trace": []}
    return graph.invoke(initial, config={"recursion_limit": 20})
