"""환경 설정 - .env 파일과 환경 변수를 읽어 Settings 객체로 만듭니다."""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    service_token: str = ""                      # Spring 과 같은 값 (X-Service-Token)
    rag_engine: Literal["stub", "atlas"] = "stub"

    chunk_size: int = 500
    chunk_overlap: int = 80
    top_k: int = 4
    min_score: float = 0.70                      # atlas 엔진 기준값
    stub_min_score: float = 0.30                 # stub 엔진 기준값
    max_rewrites: int = 1

    openai_api_key: str = ""
    chat_model: str = "gpt-4.1-mini"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    mongodb_uri: str = ""
    mongodb_db: str = "rag"
    mongodb_collection: str = "board_chunks"
    atlas_index_name: str = "board_vector_index"


@lru_cache
def get_settings() -> Settings:
    return Settings()
