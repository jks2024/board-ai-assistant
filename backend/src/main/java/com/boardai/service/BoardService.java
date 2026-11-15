package com.boardai.service;

import com.boardai.constant.IndexStatus;
import com.boardai.dto.BoardResDto;
import com.boardai.dto.BoardWriteReqDto;
import com.boardai.dto.PageResDto;
import com.boardai.entity.Board;
import com.boardai.entity.Member;
import com.boardai.exception.CustomException;
import com.boardai.rag.BoardChangedEvent;
import com.boardai.repository.BoardRepository;
import com.boardai.repository.CommentRepository;
import com.boardai.repository.MemberRepository;
import com.boardai.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/*
 * 게시글 서비스
 * - 예외를 잡아 false 를 돌려주지 않고 그대로 던집니다 → GlobalExceptionHandler 가 상태 코드로 바꿈
 *   (예외가 나면 @Transactional 이 롤백하고, 롤백되면 색인 이벤트도 실행되지 않습니다)
 * - 저장·수정·삭제 후 "바뀌었다"는 이벤트만 발행합니다. 실제 색인은 커밋 이후 BoardIndexListener 가 합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final CommentRepository commentRepository;  // 게시글 삭제 전 댓글 정리
    private final ApplicationEventPublisher eventPublisher;

    // 게시글 전체 조회 (최신순)
    @Transactional(readOnly = true)
    public List<BoardResDto> getBoardList() {
        return boardRepository.findAllByOrderByRegTimeDesc().stream().map(this::toDto).toList();
    }

    // 게시글 상세 조회 (조회수 +1)
    public BoardResDto getBoardDetail(Long id) {
        Board board = findBoard(id);
        board.increaseViewCount();   // 변경 감지로 UPDATE (색인 이벤트는 발행하지 않음)
        return toDto(board);
    }

    // 게시글 작성 → 새 글 번호 반환
    public Long writeBoard(BoardWriteReqDto dto) {
        validate(dto);
        String email = SecurityUtil.currentEmail();          // 요청 본문이 아니라 토큰의 이메일
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원이 존재하지 않습니다: " + email));
        Board board = new Board();
        board.setTitle(dto.getTitle().trim());
        board.setContent(dto.getContent());
        board.setMember(member);
        board.setIndexStatus(IndexStatus.INDEXING);           // 커밋 후 색인될 예정
        boardRepository.save(board);
        eventPublisher.publishEvent(BoardChangedEvent.upsert(board.getId()));
        return board.getId();
    }

    // 게시글 수정
    public boolean updateBoard(Long id, BoardWriteReqDto dto) {
        validate(dto);
        Board board = findBoard(id);
        checkWriter(board.getMember());
        board.setTitle(dto.getTitle().trim());
        board.setContent(dto.getContent());
        board.setIndexStatus(IndexStatus.INDEXING);   // 옛 내용으로 답하지 않도록 재색인 전까지 검색 제외
        board.setIndexError(null);
        eventPublisher.publishEvent(BoardChangedEvent.upsert(id));
        return true;
    }

    // 게시글 삭제: 댓글 → 게시글 순서로 삭제, 커밋 후 Atlas 청크도 삭제
    public boolean deleteBoard(Long id) {
        Board board = findBoard(id);
        checkWriter(board.getMember());
        commentRepository.deleteByBoardId(id);   // 댓글(FK)을 먼저 지워야 게시글 삭제 가능
        boardRepository.delete(board);
        eventPublisher.publishEvent(BoardChangedEvent.delete(id));
        return true;
    }

    // 게시글 목록 페이지네이션 조회 (최신순)
    @Transactional(readOnly = true)
    public PageResDto<BoardResDto> getBoardPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("regTime").descending());
        Page<BoardResDto> boardResDtoPage = boardRepository.findAll(pageable).map(this::toDto);
        return new PageResDto<>(boardResDtoPage);
    }

    // 제목 또는 내용에 키워드 포함
    @Transactional(readOnly = true)
    public PageResDto<BoardResDto> searchBoard(String keyword, int page, int size) {
        // 정렬 필드는 DB 컬럼명이 아니라 엔티티 필드명 (regTime)
        Pageable pageable = PageRequest.of(page, size, Sort.by("regTime").descending());
        Page<Board> boardPage = boardRepository.findByTitleContainingOrContentContaining(keyword, keyword, pageable);
        return new PageResDto<>(boardPage.map(this::toDto));
    }

    private Board findBoard(Long id) {
        return boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다: " + id));
    }

    private void validate(BoardWriteReqDto dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()
                || dto.getContent() == null || dto.getContent().isBlank()) {
            throw new CustomException("INVALID_BOARD", "제목과 내용을 모두 입력하세요.");
        }
        if (dto.getTitle().length() > 100) {
            throw new CustomException("INVALID_BOARD", "제목은 100자 이하로 입력하세요.");
        }
    }

    // 로그인 사용자 == 작성자 확인
    private void checkWriter(Member writer) {
        if (!writer.getEmail().equals(SecurityUtil.currentEmail())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "FORBIDDEN", "작성자만 수정/삭제할 수 있습니다.");
        }
    }

    // Entity -> Dto
    private BoardResDto toDto(Board board) {
        BoardResDto dto = new BoardResDto();
        dto.setBoardId(board.getId());
        dto.setTitle(board.getTitle());
        dto.setContent(board.getContent());
        dto.setEmail(board.getMember().getEmail());
        dto.setName(board.getMember().getName());
        dto.setViewCount(board.getViewCount());
        dto.setCommentCount(commentRepository.countByBoardId(board.getId()));
        dto.setRegDate(board.getRegTime());
        dto.setIndexStatus(board.getIndexStatus());
        dto.setIndexError(board.getIndexError());
        return dto;
    }
}
