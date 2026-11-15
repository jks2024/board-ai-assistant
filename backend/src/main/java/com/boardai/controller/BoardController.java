package com.boardai.controller;

import com.boardai.dto.BoardResDto;
import com.boardai.dto.BoardWriteReqDto;
import com.boardai.dto.PageResDto;
import com.boardai.service.BoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/board")   // http://localhost:8111/board/
@RequiredArgsConstructor
public class BoardController {
    private final BoardService boardService;

    // 게시글 전체 조회
    @GetMapping("/list")
    public ResponseEntity<List<BoardResDto>> boardList() {
        return ResponseEntity.ok(boardService.getBoardList());
    }

    // 게시글 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<BoardResDto> boardDetail(@PathVariable Long id) {
        return ResponseEntity.ok(boardService.getBoardDetail(id));
    }

    // 게시글 작성 → 새 글 번호
    @PostMapping("/write")
    public ResponseEntity<Long> boardWrite(@RequestBody BoardWriteReqDto dto) {
        return ResponseEntity.ok(boardService.writeBoard(dto));
    }

    // 게시글 수정
    @PutMapping("/{id}")
    public ResponseEntity<Boolean> boardModify(@PathVariable Long id, @RequestBody BoardWriteReqDto dto) {
        return ResponseEntity.ok(boardService.updateBoard(id, dto));
    }

    // 게시글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> boardDelete(@PathVariable Long id) {
        return ResponseEntity.ok(boardService.deleteBoard(id));
    }

    // 게시글 목록 페이지네이션 조회
    // GET http://localhost:8111/board/list/page?page=0&size=10
    @GetMapping("/list/page")
    public ResponseEntity<PageResDto<BoardResDto>> boardListPage(
            @RequestParam(defaultValue = "0") int page,   // Spring Data의 page는 0부터 시작
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(boardService.getBoardPage(page, size));
    }

    // 게시글 검색
    // GET http://localhost:8111/board/search?keyword=스프링&page=0&size=10
    @GetMapping("/search")
    public ResponseEntity<PageResDto<BoardResDto>> boardSearch(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(boardService.searchBoard(keyword, page, size));
    }
}
