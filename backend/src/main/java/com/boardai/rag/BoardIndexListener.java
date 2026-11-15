package com.boardai.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/*
 * 커밋 이후(AFTER_COMMIT)에만 색인합니다.
 * ① 롤백된 글이 벡터 저장소에만 남는 일을 막고
 * ② 색인하는 동안 DB 커넥션을 붙잡지 않으며
 * ③ AI 서비스 장애가 글쓰기 실패로 번지지 않게 합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BoardIndexListener {
    private final BoardIndexService indexService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBoardChanged(BoardChangedEvent event) {
        log.debug("게시글 변경 이벤트: {}", event);
        switch (event.type()) {
            case UPSERT -> indexService.index(event.boardId());
            case DELETE -> indexService.remove(event.boardId());
        }
    }
}
