from ..config import Settings
from .base import Engine, Hit


def create_engine(settings: Settings) -> Engine:
    """RAG_ENGINE 값에 따라 엔진을 고릅니다. 그래프는 Engine 약속만 알기 때문에 코드가 바뀌지 않습니다."""
    if settings.rag_engine == "atlas":
        from .atlas import AtlasEngine   # OpenAI·MongoDB 패키지는 atlas 일 때만 불러옴
        return AtlasEngine(settings)
    from .stub import StubEngine
    return StubEngine(settings)


__all__ = ["Engine", "Hit", "create_engine"]
