package com.boardai.rag;

import com.boardai.constant.IndexStatus;
import com.boardai.dto.BoardWriteReqDto;
import com.boardai.entity.Board;
import com.boardai.entity.Member;
import com.boardai.exception.CustomException;
import com.boardai.rag.dto.*;
import com.boardai.repository.BoardRepository;
import com.boardai.repository.MemberRepository;
import com.boardai.service.BoardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/*
 * 색인 동기화 통합 테스트 (MySQL 필요, FastAPI 는 Mock)
 * 테스트 메서드에 @Transactional 을 붙이지 않습니다 → 실제로 커밋되어야 AFTER_COMMIT 리스너가 실행됨
 */
@SpringBootTest
class BoardIndexFlowTest {
    static final String WRITER = "flow-writer@test.com";
    static final String OTHER = "flow-other@test.com";

    @MockitoBean RagClient ragClient;          // FastAPI 대신 가짜
    @Autowired BoardService boardService;
    @Autowired BoardRepository boardRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired RagChatService ragChatService;

    @BeforeEach
    void members() {
        for (String email : List.of(WRITER, OTHER)) {
            if (!memberRepository.existsByEmail(email)) {
                Member m = new Member();
                m.setEmail(email);
                m.setName(email.substring(0, 6));
                memberRepository.save(m);
            }
        }
    }

    private BoardWriteReqDto post(String title) {
        BoardWriteReqDto dto = new BoardWriteReqDto();
        dto.setTitle(title);
        dto.setContent("테스트 본문입니다.");
        return dto;
    }

    @Test
    @WithMockUser(username = WRITER)
    void 커밋_후_색인되면_READY() {
        Long id = boardService.writeBoard(post("색인 성공 글"));

        verify(ragClient).index(argThat(req -> req.boardId().equals(id) && req.owner().equals(WRITER)));
        Board saved = boardRepository.findById(id).orElseThrow();
        assertThat(saved.getIndexStatus()).isEqualTo(IndexStatus.READY);
        assertThat(saved.getIndexedAt()).isNotNull();
    }

    @Test
    @WithMockUser(username = WRITER)
    void AI_장애면_글은_저장되고_FAILED() {
        doThrow(new RagUnavailableException("AI 서비스에 연결할 수 없습니다.")).when(ragClient).index(any());

        Long id = boardService.writeBoard(post("색인 실패 글"));   // 예외가 글쓰기로 번지지 않음

        Board saved = boardRepository.findById(id).orElseThrow();
        assertThat(saved.getIndexStatus()).isEqualTo(IndexStatus.FAILED);
        assertThat(saved.getIndexError()).contains("연결할 수 없습니다");
    }

    @Test
    @WithMockUser(username = WRITER)
    void 검증_실패로_롤백되면_색인_요청도_없다() {
        assertThatThrownBy(() -> boardService.writeBoard(post(" ")))
                .isInstanceOf(CustomException.class);
        verify(ragClient, never()).index(any());
    }

    @Test
    @WithMockUser(username = WRITER)
    void 삭제는_커밋_후_색인도_삭제() {
        Long id = boardService.writeBoard(post("삭제할 글"));
        boardService.deleteBoard(id);
        verify(ragClient).delete(id);
        assertThat(boardRepository.findById(id)).isEmpty();
    }

    @Test
    @WithMockUser(username = OTHER)
    void 남의_글은_수정할_수_없다_403() {
        Board b = new Board();                                    // WRITER 의 글을 직접 저장
        b.setTitle("작성자 글");
        b.setContent("본문");
        b.setMember(memberRepository.findByEmail(WRITER).orElseThrow());
        Long id = boardRepository.save(b).getId();
        assertThatThrownBy(() -> boardService.updateBoard(id, post("수정 시도")))
                .isInstanceOfSatisfying(CustomException.class, e -> assertThat(e.getStatus().value()).isEqualTo(403));
    }

    @Test
    @WithMockUser(username = WRITER)
    void 내_글만_허용목록_그리고_출처_재확인() {
        Long mine = boardService.writeBoard(post("내 글"));
        when(ragClient.chat(any())).thenReturn(new RagChatRes("답변 [#" + mine + "]", false, "질문",
                List.of(new RagSource(mine, "내 글", "flow", 0.9, "…"),
                        new RagSource(987654321L, "허용목록 밖", "x", 0.95, "…")),   // FastAPI 가 잘못 돌려준 출처
                List.of("retrieve", "grade", "generate", "format")));

        RagChatRes res = ragChatService.chat(new ChatReqDto("질문", "mine"));

        ArgumentCaptor<RagChatReq> sent = ArgumentCaptor.forClass(RagChatReq.class);
        verify(ragClient).chat(sent.capture());
        List<Long> allowed = sent.getValue().allowedBoardIds();
        assertThat(allowed).contains(mine);
        // 허용목록 = 토큰 사용자(WRITER)의 READY 글만
        assertThat(allowed).containsExactlyInAnyOrderElementsOf(
                boardRepository.findIdsByIndexStatusAndEmail(IndexStatus.READY, WRITER));
        assertThat(res.sources()).extracting(RagSource::boardId).containsExactly(mine);   // 세 번째 안전장치
    }

    @Test
    @WithMockUser(username = WRITER)
    void 빈_질문은_400() {
        assertThatThrownBy(() -> ragChatService.chat(new ChatReqDto("  ", "all")))
                .isInstanceOfSatisfying(CustomException.class, e -> assertThat(e.getCode()).isEqualTo("INVALID_QUESTION"));
    }
}
