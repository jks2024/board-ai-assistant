package com.boardai.constant;

// 게시글 색인 상태: READY 인 글만 AI 검색 대상(허용목록)에 들어갑니다.
public enum IndexStatus {
    INDEXING,   // 색인 중 - 검색 제외
    READY,      // 검색 가능
    FAILED      // 색인 실패 - 사유 기록, [재색인]으로 복구
}
