"""전체 시나리오 자동 점검 - 세 서버를 켜고 seed.py 를 실행한 뒤 사용합니다.

    python scripts/e2e_check.py all        # 기본 시나리오 (답변·재작성·보류·내 글만·권한·수정·삭제)
    # FastAPI 를 끈 뒤
    python scripts/e2e_check.py down       # 글은 저장, 색인 실패(FAILED) / 질문 502
    # FastAPI 를 다시 켠 뒤
    python scripts/e2e_check.py recover    # [전체 재색인] → 검색 가능(READY) 복구

하나라도 실패하면 종료 코드 1 을 돌려줍니다. ('all' 은 스터디 공지를 지우므로 다시 하려면 seed.py 를 다시 실행)
"""
import sys
import time

import httpx

BASE = "http://localhost:8111"
PW = "Test1234!"
c = httpx.Client(base_url=BASE, timeout=90)
failures = []


def check(name, ok, detail=""):
    print(f"{'✅' if ok else '❌'} {name}" + (f"  ({detail})" if detail and not ok else ""))
    if not ok:
        failures.append(name)


def auth(email):
    tok = c.post("/auth/login", json={"email": email, "pwd": PW}).json()["accessToken"]
    return {"Authorization": f"Bearer {tok}"}


def ask(h, q, scope="all"):
    return c.post("/rag/chat", json={"question": q, "scope": scope}, headers=h)


def find_board(title):
    return next((b for b in c.get("/board/list").json() if b["title"] == title), None)


def wait_status(board_id, want, sec=20):
    for _ in range(sec * 2):
        st = c.get(f"/board/{board_id}").json()
        if st["indexStatus"] == want:
            return st
        time.sleep(0.5)
    return st


def phase_all():
    A, S = auth("admin@test.com"), auth("student@test.com")
    study = find_board("스터디 모임 공지")
    check("시드 데이터: 스터디 모임 공지 존재", study is not None)
    sid = study["boardId"]
    seed_titles = {"스터디 모임 공지", "점심 맛집 추천", "React useEffect가 두 번 실행돼요"}
    check("시드 글 색인 상태 READY", all(b["indexStatus"] == "READY" for b in c.get("/board/list").json()
                                         if b["title"] in seed_titles))

    r = ask(A, "스터디 모임은 언제 하나요?").json()
    check("답변 + 출처", not r["abstained"] and "목요일" in r["answer"] and r["sources"][0]["boardId"] == sid, r)
    check("trace: 검색→평가→생성→정리", r["trace"] == ["retrieve", "grade", "generate", "format"], r["trace"])

    r = ask(A, "오늘 날씨 어때?").json()
    check("근거 없음 → 재작성 후 보류", r["abstained"] and r["trace"] ==
          ["retrieve", "grade", "rewrite", "retrieve", "grade", "abstain", "format"], r["trace"])

    r = ask(S, "스터디 모임은 언제?", "mine").json()
    check("학생 '내 글만' → 강사 글 제외(보류)", r["abstained"] and r["sources"] == [], r)
    r = ask(S, "useEffect가 두 번 실행돼요", "mine").json()
    check("학생 '내 글만' → 자기 글로 답변", not r["abstained"] and r["sources"][0]["title"].startswith("React"), r)

    check("로그인 없이 질문 → 401", c.post("/rag/chat", json={"question": "안녕"}).status_code == 401)
    res = ask(A, "   ")
    check("빈 질문 → 400", res.status_code == 400 and res.json()["code"] == "INVALID_QUESTION", res.text)
    check("500자 초과 질문 → 400", ask(A, "가" * 501).status_code == 400)

    res = c.get("/board/999999")
    check("없는 글 → 404 {message, code}", res.status_code == 404 and res.json()["code"] == "NOT_FOUND", res.text)
    check("잘못된 메서드 → 405", c.get("/auth/signup").status_code == 405)
    check("키워드 검색 정렬(regTime) → 200", c.get("/board/search", params={"keyword": "스터디"}).status_code == 200)
    page = c.get("/board/list/page").json()
    check("페이지 기본값 0 → 첫 페이지", page["page"] == 0 and page["first"], page.get("page"))
    check("남의 글 삭제 → 403", c.delete(f"/board/{sid}", headers=S).status_code == 403)
    check("일반 회원 /admin → 403", c.post("/admin/rag/reindex", headers=S).status_code == 403)
    me = c.get("/member/me", headers=A).json()
    check("관리자 이메일 → ROLE_ADMIN", me["authority"] == "ROLE_ADMIN", me)

    # 수정 → 재색인 → 수정된 내용으로 답변
    res = c.put(f"/board/{sid}", headers=A, json={"title": "스터디 모임 공지",
                                                  "content": "스터디 모임은 이번 주부터 매주 금요일 오후 2시, 305호에서 모입니다."})
    check("글 수정 → 200", res.status_code == 200)
    check("수정 후 READY", wait_status(sid, "READY")["indexStatus"] == "READY")
    r = ask(A, "스터디 모임은 언제 하나요?").json()
    check("수정된 내용으로 답변", "금요일" in r["answer"] and "목요일" not in r["answer"], r["answer"])

    # 댓글 달린 글 삭제 → 출처에서 제외
    c.post("/comment/write", headers=S, json={"boardId": sid, "content": "참석합니다!"}).raise_for_status()
    cid = c.get(f"/comment/list/{sid}").json()[0]["commentId"]
    check("남의 댓글 삭제 → 403", c.delete(f"/comment/{cid}", headers=A).status_code == 403)
    check("댓글 달린 글 삭제 → true", c.delete(f"/board/{sid}", headers=A).json() is True)
    check("삭제한 글 → 404", c.get(f"/board/{sid}").status_code == 404)
    r = ask(A, "스터디 모임은 언제 하나요?").json()
    check("삭제한 글은 출처에 없음", all(s["boardId"] != sid for s in r["sources"]), r["sources"])

    check("로그아웃 → 204", c.post("/auth/logout", headers=S).status_code == 204)


def phase_down():
    A = auth("admin@test.com")
    bid = c.post("/board/write", headers=A, json={"title": "AI 장애 중 작성한 글",
                                                  "content": "FastAPI가 꺼져 있어도 게시판은 정상 동작합니다."}).json()
    b = c.get(f"/board/{bid}").json()
    check("AI 장애에도 글 저장", isinstance(bid, int))
    check("색인 실패(FAILED) + 사유", b["indexStatus"] == "FAILED" and "연결할 수 없습니다" in (b["indexError"] or ""), b)
    res = ask(A, "스터디 모임은 언제 하나요?")
    check("질문 → 502 AI_UNAVAILABLE", res.status_code == 502 and res.json()["code"] == "AI_UNAVAILABLE", res.text)
    check("게시판 목록은 정상", c.get("/board/list").status_code == 200)


def phase_recover():
    A = auth("admin@test.com")
    r = c.post("/admin/rag/reindex", headers=A).json()
    check("전체 재색인 → 모두 READY", r["failed"] == 0 and r["ready"] == r["total"], r)
    b = find_board("AI 장애 중 작성한 글")
    check("실패했던 글 → READY", b and b["indexStatus"] == "READY", b)
    res = c.post(f"/rag/reindex/{b['boardId']}", headers=A).json()
    check("글 하나 재색인 → READY", res["indexStatus"] == "READY", res)
    r = ask(A, "FastAPI가 꺼져 있으면 게시판은?").json()
    check("복구 후 답변", not r["abstained"], r)


if __name__ == "__main__":
    phase = sys.argv[1] if len(sys.argv) > 1 else "all"
    {"all": phase_all, "down": phase_down, "recover": phase_recover}[phase]()
    print(f"\n[{phase}] {'모두 통과' if not failures else f'실패 {len(failures)}건: {failures}'}")
    sys.exit(1 if failures else 0)
