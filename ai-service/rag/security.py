"""서비스 토큰 확인 - "Spring 이 부른 요청인가?"

사용자 토큰(JWT)은 "어느 사용자인가", 서비스 토큰은 "Spring 서버가 보낸 요청인가"를 확인합니다.
브라우저는 FastAPI 를 직접 부르지 않습니다.
"""
import secrets

from fastapi import Depends, Header, HTTPException, status

from .config import Settings, get_settings


def verify_service_token(
    x_service_token: str | None = Header(default=None, description="Spring 과 공유하는 서비스 토큰"),
    settings: Settings = Depends(get_settings),
) -> None:
    expected = settings.service_token
    if not expected or not x_service_token or not secrets.compare_digest(x_service_token, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="서비스 토큰이 올바르지 않습니다.")
