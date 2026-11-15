package com.boardai.rag.dto;

// React → Spring 질문. scope: "all"(전체 글) | "mine"(내 글만)
public record ChatReqDto(String question, String scope) {}
