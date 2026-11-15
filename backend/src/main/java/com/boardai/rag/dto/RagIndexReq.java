package com.boardai.rag.dto;

// Spring → FastAPI 색인 요청 (JSON 은 camelCase, FastAPI 가 snake_case 로 받음)
public record RagIndexReq(Long boardId, String title, String content, String owner, String ownerName) {}
