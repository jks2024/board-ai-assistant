"""시연용 데이터 넣기 - Spring API 를 그대로 호출합니다 (가입 → 로그인 → 글쓰기 → 자동 색인)

사용법 (세 서버 중 Spring·FastAPI 가 켜져 있어야 함):
    python scripts/seed.py                 # http://localhost:8111
    python scripts/seed.py http://host:8111

계정 (비밀번호 모두 Test1234!)
    admin@test.com   강사  (backend/.env 의 ADMIN_EMAILS 에 있으면 관리자)
    student@test.com 학생
"""
import sys

import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8111"
PASSWORD = "Test1234!"

ACCOUNTS = {
    "admin@test.com": "강사",
    "student@test.com": "학생",
}

POSTS = [
    ("admin@test.com", "스터디 모임 공지",
     "스터디 모임은 매주 목요일 저녁 7시, 302호에서 모입니다.\n"
     "이번 주 주제는 Spring Security와 JWT 인증입니다. 노트북과 충전기를 꼭 챙겨 오세요.\n"
     "참석이 어려우면 전날까지 댓글로 알려 주세요."),
    ("admin@test.com", "RAG 미니 프로젝트 과제 제출 안내",
     "RAG 미니 프로젝트 과제는 11월 26일 자정까지 제출합니다.\n"
     "제출물은 GitHub 저장소 주소, 시연 영상 링크, 발표 자료(PDF) 세 가지입니다.\n"
     "늦게 제출하면 감점이 있으니 일정을 미리 확인하세요."),
    ("admin@test.com", "LazyInitializationException 해결 방법",
     "트랜잭션이 끝난 뒤에 지연 로딩(LAZY) 연관 엔티티에 접근하면 LazyInitializationException이 발생합니다.\n"
     "서비스 계층의 @Transactional 안에서 DTO로 변환하거나, join fetch 또는 @EntityGraph로 연관 엔티티를 함께 조회하세요.\n"
     "open-in-view 설정에 기대지 않는 것이 좋습니다."),
    ("admin@test.com", "JWT 만료 오류(401) 해결법",
     "Access Token이 만료되면 서버는 401을 응답합니다.\n"
     "React의 Axios 응답 인터셉터가 /auth/reissue로 새 토큰을 받아 원래 요청을 다시 보냅니다.\n"
     "Refresh Token까지 만료되었거나 재사용이 감지되면 다시 로그인해야 합니다."),
    ("admin@test.com", "중간 점검 일정",
     "중간 점검은 11월 17일 오후 2시부터 조별로 진행합니다.\n"
     "조마다 10분 동안 진행 상황을 시연하고, 남은 일정과 역할 분담을 발표합니다."),
    ("admin@test.com", "카카오 로그인 KOE006 오류",
     "카카오 로그인에서 KOE006 오류가 나면 리다이렉트 URI가 콘솔에 등록된 값과 다른 경우입니다.\n"
     "카카오 개발자 콘솔의 Redirect URI와 .env.local의 REACT_APP_KAKAO_REDIRECT_URI가 글자 하나까지 같은지 확인하세요."),
    ("student@test.com", "점심 맛집 추천",
     "학원 앞 골목의 김치찌개 집이 가격도 착하고 양이 많습니다.\n"
     "돈가스는 역 앞 2층 가게가 바삭해서 좋아요. 점심시간에는 줄이 길어서 11시 50분쯤 가는 걸 추천합니다."),
    ("student@test.com", "3조 팀 프로젝트 회의록",
     "주제: 맛집 리뷰를 근거로 답하는 RAG 챗봇.\n"
     "역할: 프론트엔드 2명, 백엔드 1명, AI 서비스 1명.\n"
     "다음 회의 전까지 리뷰 시드 데이터 50개를 준비하기로 했습니다."),
    ("student@test.com", "React useEffect가 두 번 실행돼요",
     "개발 모드에서 useEffect가 두 번 실행되는 것은 React StrictMode 때문입니다.\n"
     "배포 빌드에서는 한 번만 실행됩니다. 카카오 인가 코드처럼 한 번만 써야 하는 값은 useRef로 중복 호출을 막으세요."),
    ("student@test.com", "MySQL Public Key Retrieval 오류",
     "MySQL 8에 접속할 때 Public Key Retrieval is not allowed 오류가 나면\n"
     "접속 URL에 allowPublicKeyRetrieval=true 옵션을 추가하면 해결됩니다."),
]


def main() -> None:
    with httpx.Client(base_url=BASE, timeout=90) as c:
        tokens = {}
        for email, name in ACCOUNTS.items():
            if not c.get(f"/auth/exists/{email}").json():
                c.post("/auth/signup", json={"email": email, "pwd": PASSWORD, "name": name}).raise_for_status()
                print(f"가입: {email} ({name})")
            res = c.post("/auth/login", json={"email": email, "pwd": PASSWORD})
            res.raise_for_status()
            tokens[email] = res.json()["accessToken"]

        existing = {b["title"] for b in c.get("/board/list").json()}
        for email, title, content in POSTS:
            if title in existing:
                print(f"건너뜀(이미 있음): {title}")
                continue
            res = c.post("/board/write", json={"title": title, "content": content},
                         headers={"Authorization": f"Bearer {tokens[email]}"})
            res.raise_for_status()
            print(f"글 #{res.json()}: {title}")

        print("\n색인 상태")
        for b in c.get("/board/list").json():
            print(f"  #{b['boardId']:<3} {str(b['indexStatus']):<9} {b['title']}")


if __name__ == "__main__":
    main()
