from conftest import HEADERS


def ask(client, question, allowed=(1, 2, 3)):
    res = client.post("/chat", json={"question": question, "allowedBoardIds": list(allowed)}, headers=HEADERS)
    assert res.status_code == 200, res.text
    return res.json()


def test_health(client):
    body = client.get("/health").json()
    assert body["status"] == "ok" and body["engine"] == "stub" and body["chunks"] >= 3


def test_service_token_required(client):
    assert client.post("/chat", json={"question": "안녕", "allowedBoardIds": [1]}).status_code == 401
    bad = {"X-Service-Token": "wrong"}
    assert client.post("/chat", json={"question": "안녕", "allowedBoardIds": [1]}, headers=bad).status_code == 401


def test_validation_422(client):
    assert client.post("/chat", json={"question": "", "allowedBoardIds": [1]}, headers=HEADERS).status_code == 422
    assert client.post("/chat", json={"question": "가" * 501}, headers=HEADERS).status_code == 422
    assert client.post("/index", json={"boardId": 0, "title": "t", "content": "c", "owner": "o"},
                       headers=HEADERS).status_code == 422


def test_answer_with_source(client):
    body = ask(client, "스터디 모임은 언제 하나요?")
    assert body["abstained"] is False
    assert "목요일" in body["answer"] and "[#1]" in body["answer"]
    assert body["sources"][0]["boardId"] == 1          # camelCase 응답
    assert body["trace"] == ["retrieve", "grade", "generate", "format"]


def test_rewrite_then_abstain(client):
    body = ask(client, "오늘 날씨 어때?")
    assert body["abstained"] is True and body["sources"] == []
    assert body["trace"] == ["retrieve", "grade", "rewrite", "retrieve", "grade", "abstain", "format"]


def test_allowlist_excludes_other_posts(client):
    # "내 글만"(학생 글 3번만 허용) → 강사의 스터디 공지는 검색되지 않음
    body = ask(client, "스터디 모임은 언제?", allowed=[3])
    assert body["abstained"] is True
    assert ask(client, "스터디 모임은 언제?", allowed=[])["abstained"] is True


def test_update_replaces_chunks(client):
    p = {"boardId": 1, "title": "스터디 모임 공지", "owner": "admin@test.com", "ownerName": "강사",
         "content": "스터디 모임은 이번 주부터 금요일 오후 2시로 바뀝니다."}
    assert client.post("/index", json=p, headers=HEADERS).json()["chunks"] == 1
    body = ask(client, "스터디 모임은 언제 하나요?")
    assert "금요일" in body["answer"] and "목요일" not in body["answer"]


def test_delete_removes_from_search(client):
    assert client.delete("/index/1", headers=HEADERS).json() == {"boardId": 1, "deleted": 1}
    body = ask(client, "스터디 모임은 언제 하나요?")
    assert all(s["boardId"] != 1 for s in body["sources"])
