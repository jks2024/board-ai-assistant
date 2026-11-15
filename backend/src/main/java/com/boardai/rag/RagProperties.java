package com.boardai.rag;

import org.springframework.boot.context.properties.ConfigurationProperties;

// application.properties 의 rag.* 값을 한 번에 묶는 설정 record
@ConfigurationProperties(prefix = "rag")
public record RagProperties(
        String baseUrl,          // FastAPI 주소 (http://localhost:8000)
        String serviceToken,     // X-Service-Token 헤더 값 (FastAPI 와 같아야 함)
        int connectTimeoutMs,    // 연결 제한 시간 - FastAPI 가 꺼져 있으면 빨리 실패
        int readTimeoutMs        // 응답 제한 시간 - LLM 답변 생성 시간을 고려
) {}
