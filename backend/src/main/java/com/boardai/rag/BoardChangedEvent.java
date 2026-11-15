package com.boardai.rag;

// "게시글이 바뀌었다"는 사실만 담은 이벤트 (무엇을 할지는 리스너가 결정)
public record BoardChangedEvent(Long boardId, Type type) {
    public enum Type { UPSERT, DELETE }

    public static BoardChangedEvent upsert(Long boardId) { return new BoardChangedEvent(boardId, Type.UPSERT); }
    public static BoardChangedEvent delete(Long boardId) { return new BoardChangedEvent(boardId, Type.DELETE); }
}
