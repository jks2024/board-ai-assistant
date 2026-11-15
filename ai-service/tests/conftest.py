import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app            # noqa: E402
from rag.config import Settings       # noqa: E402

TOKEN = "test-token"
HEADERS = {"X-Service-Token": TOKEN}

POSTS = [
    dict(boardId=1, title="스터디 모임 공지", owner="admin@test.com", ownerName="강사",
         content="스터디 모임은 매주 목요일 저녁 7시, 302호에서 모입니다. 노트북을 챙겨 오세요."),
    dict(boardId=2, title="LazyInitializationException 해결", owner="admin@test.com", ownerName="강사",
         content="트랜잭션이 끝난 뒤 지연 로딩 엔티티에 접근하면 예외가 납니다. join fetch 로 함께 조회하세요."),
    dict(boardId=3, title="점심 맛집 추천", owner="student@test.com", ownerName="학생",
         content="학원 앞 김치찌개 집이 맛있습니다. 점심시간에는 줄이 깁니다."),
]


@pytest.fixture()
def client():
    settings = Settings(_env_file=None, service_token=TOKEN, rag_engine="stub")
    with TestClient(create_app(settings)) as c:   # with → lifespan 실행
        for p in POSTS:
            assert c.post("/index", json=p, headers=HEADERS).status_code == 200
        yield c
