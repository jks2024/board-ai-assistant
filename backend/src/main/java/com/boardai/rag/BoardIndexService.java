package com.boardai.rag;

import com.boardai.constant.Authority;
import com.boardai.constant.IndexStatus;
import com.boardai.exception.CustomException;
import com.boardai.rag.dto.RagIndexReq;
import com.boardai.rag.dto.ReindexResDto;
import com.boardai.repository.BoardRepository;
import com.boardai.repository.MemberRepository;
import com.boardai.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/*
 * 색인 실행 + 실패 보상(재색인)
 * MySQL 과 벡터 저장소는 한 트랜잭션으로 묶을 수 없으므로
 * "상태를 기록해 두고, 실패하면 다시 시도한다"는 방식으로 두 저장소를 맞춥니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BoardIndexService {
    private final RagClient ragClient;
    private final IndexStatusService statusService;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;

    // 색인: 성공 → READY, 실패 → FAILED + 사유
    public IndexStatus index(Long boardId) {
        Optional<RagIndexReq> payload = statusService.loadPayload(boardId);
        if (payload.isEmpty()) return null;            // 그 사이 삭제된 글
        try {
            ragClient.index(payload.get());
            statusService.markReady(boardId);
            return IndexStatus.READY;
        } catch (RagUnavailableException e) {
            log.warn("색인 실패 board={} : {}", boardId, e.getMessage());
            statusService.markFailed(boardId, e.getMessage());
            return IndexStatus.FAILED;
        }
    }

    // 색인 삭제: 실패해도 괜찮음 (MySQL 에 행이 없으면 허용목록에 들어가지 않음)
    public void remove(Long boardId) {
        try {
            ragClient.delete(boardId);
        } catch (RagUnavailableException e) {
            log.warn("색인 삭제 실패 board={} (허용목록에서 빠지므로 검색되지 않음): {}", boardId, e.getMessage());
        }
    }

    // [재색인] 한 건 - 작성자 또는 관리자
    public IndexStatus reindexOne(Long boardId) {
        String email = SecurityUtil.currentEmail();
        var board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다: " + boardId));
        boolean admin = memberRepository.findByEmail(email)
                .map(m -> m.getAuthority() == Authority.ROLE_ADMIN).orElse(false);
        if (!admin && !board.getMember().getEmail().equals(email)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "FORBIDDEN", "작성자만 재색인할 수 있습니다.");
        }
        statusService.markIndexing(boardId);
        return index(boardId);
    }

    // [전체 재색인] - 관리자 (/admin/**). AI 기능 추가 전 글, 스텁 엔진 재시작 후 복구용
    public ReindexResDto reindexAll() {
        List<Long> ids = boardRepository.findAllIds();
        int ready = 0, failed = 0;
        for (Long id : ids) {
            statusService.markIndexing(id);
            if (index(id) == IndexStatus.READY) ready++; else failed++;
        }
        log.info("전체 재색인: {}건 (성공 {}, 실패 {})", ids.size(), ready, failed);
        return new ReindexResDto(ids.size(), ready, failed);
    }
}
