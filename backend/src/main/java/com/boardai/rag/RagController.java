package com.boardai.rag;

import com.boardai.constant.IndexStatus;
import com.boardai.rag.dto.ChatReqDto;
import com.boardai.rag.dto.RagChatRes;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/rag")   // 모두 로그인 필요 (SecurityConfig: anyRequest().authenticated())
@RequiredArgsConstructor
public class RagController {
    private final RagChatService ragChatService;
    private final BoardIndexService boardIndexService;

    // AI 질문: POST /rag/chat {question, scope}
    @PostMapping("/chat")
    public ResponseEntity<RagChatRes> chat(@RequestBody ChatReqDto dto) {
        return ResponseEntity.ok(ragChatService.chat(dto));
    }

    // 글 하나 재색인 (작성자/관리자): POST /rag/reindex/{boardId}
    @PostMapping("/reindex/{boardId}")
    public ResponseEntity<Map<String, Object>> reindex(@PathVariable Long boardId) {
        IndexStatus status = boardIndexService.reindexOne(boardId);
        return ResponseEntity.ok(Map.of("boardId", boardId, "indexStatus", String.valueOf(status)));
    }
}
