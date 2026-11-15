package com.boardai.rag.dto;

import java.util.List;

// FastAPI → Spring → React 응답
public record RagChatRes(
        String answer,
        boolean abstained,        // 근거가 없어 답하지 않음
        String finalQuery,        // 마지막으로 검색한 질문 (재작성되었으면 바뀐 질문)
        List<RagSource> sources,
        List<String> trace        // 지나간 노드: retrieve, grade, rewrite, generate, abstain, format
) {}
