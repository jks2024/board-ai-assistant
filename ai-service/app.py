"""게시판 AI 도우미 - AI 서비스 (FastAPI)

실행: uvicorn app:app --reload --port 8000   →  Swagger: http://localhost:8000/docs
Spring 만 이 서버를 부릅니다 (X-Service-Token). 브라우저는 직접 부르지 않습니다.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request

from rag.config import Settings, get_settings
from rag.engines import create_engine
from rag.graph import build_graph, run_graph
from rag.schemas import (ChatRequest, ChatResponse, DeleteResponse, HealthResponse,
                         IndexRequest, IndexResponse)
from rag.security import verify_service_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
log = logging.getLogger("rag-ai-service")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # 시작할 때 한 번: 엔진(외부 클라이언트)과 그래프를 만들어 app.state 에 보관
        engine = create_engine(settings)
        app.state.engine = engine
        app.state.graph = build_graph(engine, top_k=settings.top_k, max_rewrites=settings.max_rewrites)
        if not settings.service_token:
            log.warning("SERVICE_TOKEN 이 비어 있습니다. 모든 요청이 401 로 거절됩니다.")
        log.info("AI 서비스 시작 - engine=%s", engine.name)
        yield
        engine.close()                    # 종료할 때 한 번: 연결 정리
        log.info("AI 서비스 종료")

    app = FastAPI(
        title="게시판 AI 도우미 - AI 서비스",
        description="게시글 색인·삭제·질의 API (FastAPI · LangChain · LangGraph)",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.dependency_overrides[get_settings] = lambda: settings
    protected = [Depends(verify_service_token)]

    @app.get("/health", response_model=HealthResponse, tags=["상태"])
    def health(request: Request):
        engine = request.app.state.engine
        return HealthResponse(status="ok", engine=engine.name, chunks=engine.count())

    @app.post("/index", response_model=IndexResponse, dependencies=protected, tags=["색인"])
    def index(req: IndexRequest, request: Request):
        try:
            chunks = request.app.state.engine.index(req)
        except Exception as e:                       # OpenAI·Atlas 장애 → 502
            log.exception("색인 실패 board=%s", req.board_id)
            raise HTTPException(status_code=502, detail=f"색인 실패: {type(e).__name__}") from e
        log.info("색인 board=%s chunks=%s", req.board_id, chunks)
        return IndexResponse(board_id=req.board_id, chunks=chunks)

    @app.delete("/index/{board_id}", response_model=DeleteResponse, dependencies=protected, tags=["색인"])
    def delete(board_id: int, request: Request):
        deleted = request.app.state.engine.delete(board_id)
        log.info("색인 삭제 board=%s chunks=%s", board_id, deleted)
        return DeleteResponse(board_id=board_id, deleted=deleted)

    @app.post("/chat", response_model=ChatResponse, dependencies=protected, tags=["질의"])
    def chat(req: ChatRequest, request: Request):
        try:
            result = run_graph(request.app.state.graph, req.question, req.allowed_board_ids)
        except Exception as e:
            log.exception("그래프 실행 실패")
            raise HTTPException(status_code=502, detail=f"답변 생성 실패: {type(e).__name__}") from e
        log.info("질문=%r trace=%s", req.question, result["trace"])
        return ChatResponse(
            answer=result["answer"],
            abstained=result.get("abstained", False),
            final_query=result.get("query", req.question),
            sources=result.get("sources", []),
            trace=result["trace"],
        )

    return app


app = create_app()
