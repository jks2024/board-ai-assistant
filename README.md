# 게시판 AI 도우미 — Spring Boot · React · FastAPI · LangGraph 풀스택 RAG

게시판에 쓴 글이 그대로 AI의 지식이 되는 서비스입니다. 글을 쓰면 자동으로 색인되고, 고치면 다시 색인되고, 지우면 검색에서 빠집니다. AI는 **게시판 글만 근거로, 출처 번호를 붙여, 권한 안에서** 답합니다.

```
"스터디 모임은 언제 하나요?"
→ 스터디 모임은 매주 목요일 저녁 7시, 302호에서 모입니다. [#1]
   출처 #1 스터디 모임 공지 · 강사 · 유사도 0.91
   검색 → 근거 평가 → 답변 생성 → 정리
```

## 구성

| 폴더 | 기술 | 포트 | 하는 일 |
| --- | --- | --- | --- |
| `backend/` | Spring Boot 4 · Java 21 · Gradle · JPA · MySQL 8 · Spring Security · JWT | 8111 | 회원·게시판·댓글, JWT + Refresh Token(Rotation), 카카오 로그인, 색인 상태·READY 허용목록, 커밋 후 색인 이벤트, AI 서비스 호출 |
| `frontend/` | React 19 · CRA · React Router 7 · styled-components · Axios | 3000 | 게시판(메인), 글쓰기·수정, 색인 상태 배지·재색인, AI 도우미(인용·출처·실행 경로) |
| `ai-service/` | FastAPI · Pydantic · LangChain · LangGraph · (OpenAI · MongoDB Atlas) | 8000 | 색인·삭제·질의 API, 청크 분할·임베딩·벡터 검색, 근거 평가 → 답변 / 재검색 / 보류 그래프 |

```
React (:3000) ──Bearer JWT──▶ Spring Boot (:8111) ──X-Service-Token──▶ FastAPI (:8000)
                                   │                                     ├─ LangChain : 분할 → 임베딩 → 검색 → 생성
                                 MySQL                                    └─ LangGraph : retrieve → grade → generate | rewrite↺ | abstain → format
                       (원본 · 색인 상태 · 허용목록)                          (stub 엔진 또는 OpenAI + MongoDB Atlas)
```

## 준비물

JDK 21, MySQL 8.x, Node 18 이상, Python 3.11~3.13 (conda 권장). OpenAI 키·Atlas 계정은 `atlas` 엔진을 쓸 때만 필요합니다. 처음에는 **stub 엔진**으로 키 없이 전체 흐름을 확인합니다.

## 실행 — 터미널 3개

```bash
git clone https://github.com/jks2024/board-ai-assistant.git
cd board-ai-assistant

# ① AI 서비스 (FastAPI)
cd ai-service
conda create -n rag-ai python=3.12 -y && conda activate rag-ai   # 또는 python -m venv .venv
pip install -r requirements.txt
cp .env.example .env            # SERVICE_TOKEN 입력 (backend 와 같은 값), RAG_ENGINE=stub
uvicorn app:app --reload --port 8000          # http://localhost:8000/docs

# ② 백엔드 (Spring Boot)
cd backend
cp .env.example .env            # MYSQL_PASSWORD, JWT_SECRET, SERVICE_TOKEN 입력
./gradlew bootRun               # Windows: gradlew.bat bootRun   →  http://localhost:8111/swagger-ui.html

# ③ 프론트엔드 (React)
cd frontend
npm install
cp .env.local.example .env.local  # 카카오 로그인을 쓸 때만 값 입력
npm start                       # http://localhost:3000

# 시연 데이터 (계정 2개 + 글 10개, 자동 색인)
cd ai-service && python scripts/seed.py
```

시드 계정: `admin@test.com`(강사, 관리자) / `student@test.com`(학생), 비밀번호 `Test1234!`

## 확인할 시나리오

| 시나리오 | 기대 결과 |
| --- | --- |
| "스터디 모임은 언제 하나요?" | 답변 + 출처 #1 + `검색 → 근거 평가 → 답변 생성 → 정리` |
| "오늘 날씨 어때?" | `검색 → 근거 평가 → 질문 재작성 → 검색 → 근거 평가 → 답변 보류 → 정리` |
| 학생 계정, **내 글만**, "스터디 모임은 언제?" | 답변 보류 — 강사의 글은 허용목록에 없음 |
| 스터디 공지를 "금요일 오후 2시"로 수정 후 같은 질문 | 수정된 내용으로 답변 |
| 스터디 공지(댓글 포함) 삭제 후 같은 질문 | 삭제 성공, #1이 출처에 나오지 않음 |
| 로그아웃 상태에서 AI 도우미 | 로그인 화면으로 |
| FastAPI 중지 후 글 작성 | 글은 저장, 배지 "색인 실패" / 질문은 "AI 서비스에 연결할 수 없습니다." (502) |
| FastAPI 재시작 후 [재색인] | 배지 "검색 가능"으로 복구 |

## Atlas 엔진으로 바꾸기

1. MongoDB Atlas 무료 클러스터 생성 → Network Access에 내 IP 허용 → 연결 문자열 복사
2. `ai-service/.env`: `RAG_ENGINE=atlas`, `OPENAI_API_KEY`, `MONGODB_URI` 입력
3. `python scripts/create_atlas_index.py` (벡터 인덱스 `board_vector_index`, 1536차원, filter `boardId`)
4. FastAPI 재시작 → 관리자 계정으로 메인 화면 **[전체 재색인]**

## 테스트

```bash
cd ai-service && pytest -q          # API·그래프 11개
cd backend && ./gradlew test        # MySQL 필요 (.env)
cd frontend && npm run build
```

## 라이선스

이 저장소는 전자책 「게시판 AI 도우미 — 풀스택 RAG 실전」 구매자 학습용입니다. 개인·업무 프로젝트에 코드를 자유롭게 사용할 수 있으나, 저장소와 전자책 자체의 재배포·재판매는 금합니다.
