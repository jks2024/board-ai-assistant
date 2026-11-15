package com.boardai.rag;

import com.boardai.exception.CustomException;
import org.springframework.http.HttpStatus;

// AI 서비스(FastAPI) 호출 실패 → 502 Bad Gateway. 게시판 기능은 그대로 동작합니다.
public class RagUnavailableException extends CustomException {
    public RagUnavailableException(String message) {
        super(HttpStatus.BAD_GATEWAY, "AI_UNAVAILABLE", message);
    }
}
