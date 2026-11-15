package com.boardai.rag.dto;

// 답변의 근거가 된 게시글
public record RagSource(Long boardId, String title, String ownerName, double score, String snippet) {}
