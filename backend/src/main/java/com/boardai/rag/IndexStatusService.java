package com.boardai.rag;

import com.boardai.constant.IndexStatus;
import com.boardai.rag.dto.RagIndexReq;
import com.boardai.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/*
 * 색인 상태 기록 전담 (모든 메서드가 REQUIRES_NEW)
 * AFTER_COMMIT 리스너 안에서는 원래 트랜잭션이 이미 끝났습니다. 그 안에서 REQUIRED 로 쓰면
 * "끝난 트랜잭션"에 참여해 UPDATE 가 커밋되지 않습니다. 그래서 항상 새 트랜잭션을 엽니다.
 * (같은 클래스 안에서 부르면 프록시를 거치지 않으므로 별도 빈으로 분리)
 */
@Service
@RequiredArgsConstructor
public class IndexStatusService {
    private final BoardRepository boardRepository;

    // 색인에 보낼 내용 읽기 (LAZY 인 작성자 정보까지 트랜잭션 안에서 꺼냄)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public Optional<RagIndexReq> loadPayload(Long boardId) {
        return boardRepository.findById(boardId).map(b -> new RagIndexReq(
                b.getId(), b.getTitle(), b.getContent(),
                b.getMember().getEmail(), b.getMember().getName()));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markIndexing(Long boardId) {
        boardRepository.updateIndexStatus(boardId, IndexStatus.INDEXING, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markReady(Long boardId) {
        boardRepository.updateIndexStatus(boardId, IndexStatus.READY, null, LocalDateTime.now());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long boardId, String reason) {
        String error = reason == null ? "알 수 없는 오류" : reason.substring(0, Math.min(reason.length(), 500));
        boardRepository.updateIndexStatus(boardId, IndexStatus.FAILED, error, null);
    }
}
