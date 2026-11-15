package com.boardai.service;

import com.boardai.dto.CommentResDto;
import com.boardai.dto.CommentWriteReqDto;
import com.boardai.dto.PageResDto;
import com.boardai.entity.Board;
import com.boardai.entity.Comment;
import com.boardai.entity.Member;
import com.boardai.exception.CustomException;
import com.boardai.repository.BoardRepository;
import com.boardai.repository.CommentRepository;
import com.boardai.repository.MemberRepository;
import com.boardai.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final CommentRepository commentRepository;

    // 게시글별 댓글 목록 조회 (작성 순)
    @Transactional(readOnly = true)
    public List<CommentResDto> getCommentList(Long boardId) {
        return commentRepository.findByBoardIdOrderByRegDateAsc(boardId).stream().map(this::toDto).toList();
    }

    // 댓글 작성 (작성자는 토큰의 사용자)
    public boolean writeComment(CommentWriteReqDto dto) {
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new CustomException("INVALID_COMMENT", "댓글 내용을 입력하세요.");
        }
        String email = SecurityUtil.currentEmail();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원이 존재하지 않습니다: " + email));
        Board board = boardRepository.findById(dto.getBoardId())
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다: " + dto.getBoardId()));
        Comment comment = new Comment();
        comment.setContent(dto.getContent());
        comment.setMember(member);
        comment.setBoard(board);
        commentRepository.save(comment);
        return true;
    }

    // 댓글 수정
    public boolean updateComment(Long commentId, CommentWriteReqDto dto) {
        Comment comment = findComment(commentId);
        checkWriter(comment.getMember());
        comment.setContent(dto.getContent());
        return true;
    }

    // 댓글 삭제 - 작성자만 (1-5 과제 반영)
    public boolean deleteComment(Long commentId) {
        Comment comment = findComment(commentId);
        checkWriter(comment.getMember());
        commentRepository.delete(comment);
        return true;
    }

    // 회원이 쓴 댓글 목록
    @Transactional(readOnly = true)
    public PageResDto<CommentResDto> getMemberCommentPage(String email, int page, int size) {
        if (!memberRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("해당 회원이 존재하지 않습니다: " + email);
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("regDate").descending());
        return new PageResDto<>(commentRepository.findByMemberEmail(email, pageable).map(this::toDto));
    }

    private Comment findComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 존재하지 않습니다: " + commentId));
    }

    private void checkWriter(Member writer) {
        if (!writer.getEmail().equals(SecurityUtil.currentEmail())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "FORBIDDEN", "작성자만 수정/삭제할 수 있습니다.");
        }
    }

    // Entity -> Dto
    private CommentResDto toDto(Comment comment) {
        CommentResDto dto = new CommentResDto();
        dto.setCommentId(comment.getCommentId());
        dto.setBoardId(comment.getBoard().getId());
        dto.setContent(comment.getContent());
        dto.setEmail(comment.getMember().getEmail());
        dto.setName(comment.getMember().getName());
        dto.setRegDate(comment.getRegDate());
        return dto;
    }
}
