package com.boardai.rag.dto;

import java.util.List;

// Spring → FastAPI 질문 요청. allowedBoardIds = READY 허용목록 (Spring 이 정함)
public record RagChatReq(String question, List<Long> allowedBoardIds) {}
