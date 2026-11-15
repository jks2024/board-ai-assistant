package com.boardai.controller;

import com.boardai.rag.BoardIndexService;
import com.boardai.rag.dto.ReindexResDto;
import com.boardai.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// /admin/** 는 ROLE_ADMIN 만 (SecurityConfig)
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AuthService authService;
    private final BoardIndexService boardIndexService;

    // 탈취 신고 시 강제 로그아웃
    @DeleteMapping("/token/{email}")
    public ResponseEntity<Void> revoke(@PathVariable String email) {
        authService.revoke(email);
        return ResponseEntity.noContent().build();
    }

    // 전체 재색인: POST /admin/rag/reindex
    @PostMapping("/rag/reindex")
    public ResponseEntity<ReindexResDto> reindexAll() {
        return ResponseEntity.ok(boardIndexService.reindexAll());
    }
}
