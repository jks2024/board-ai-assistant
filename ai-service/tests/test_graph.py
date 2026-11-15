from rag.config import Settings
from rag.chunking import make_splitter, split_post
from rag.engines.stub import StubEngine, overlap_score
from rag.graph import build_graph, run_graph
from rag.schemas import IndexRequest


def test_chunk_overlap_and_title_prefix():
    splitter = make_splitter(chunk_size=100, chunk_overlap=20)
    content = " ".join(f"문장{i}은 겹침을 확인하기 위한 예시 문장입니다." for i in range(12))
    chunks = split_post(splitter, "겹침 테스트", content)
    assert len(chunks) > 1 and all(c.startswith("제목: 겹침 테스트\n") for c in chunks)


def test_stub_score_is_lexical_not_semantic():
    assert overlap_score("스터디 모임", "스터디 모임 공지") == 1.0
    assert overlap_score("모여요", "모임") < 0.5          # 스텁은 의미를 모름


def test_max_rewrites_zero_goes_straight_to_abstain():
    engine = StubEngine(Settings(_env_file=None))
    engine.index(IndexRequest(board_id=1, title="공지", content="목요일 모임", owner="a"))
    graph = build_graph(engine, max_rewrites=0)
    state = run_graph(graph, "날씨 어때", [1])
    assert state["trace"] == ["retrieve", "grade", "abstain", "format"]
