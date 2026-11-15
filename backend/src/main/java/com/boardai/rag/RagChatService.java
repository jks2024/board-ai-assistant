package com.boardai.rag;

import com.boardai.constant.IndexStatus;
import com.boardai.exception.CustomException;
import com.boardai.rag.dto.ChatReqDto;
import com.boardai.rag.dto.RagChatReq;
import com.boardai.rag.dto.RagChatRes;
import com.boardai.rag.dto.RagSource;
import com.boardai.repository.BoardRepository;
import com.boardai.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/*
 * AI 질문 처리 (채팅 ChatService 와 이름이 겹치지 않도록 RagChatService)
 * ① 로그인 확인(JWT) ② 질문 검증 ③ READY 허용목록 생성 ④ FastAPI 호출 ⑤ 출처 재확인
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagChatService {
    public static final int MAX_QUESTION = 500;

    private final BoardRepository boardRepository;
    private final RagClient ragClient;

    public RagChatRes chat(ChatReqDto req) {
        String email = SecurityUtil.currentEmail();                        // ① 401
        String question = req.question() == null ? "" : req.question().trim();
        if (question.isEmpty()) {                                           // ② 400
            throw new CustomException("INVALID_QUESTION", "질문을 입력하세요.");
        }
        if (question.length() > MAX_QUESTION) {
            throw new CustomException("INVALID_QUESTION", "질문은 " + MAX_QUESTION + "자 이하로 입력하세요.");
        }

        // ③ 허용목록: "내 글만"이면 요청 본문이 아니라 토큰의 사용자 기준
        boolean mine = "mine".equalsIgnoreCase(req.scope());
        List<Long> allowed = mine
                ? boardRepository.findIdsByIndexStatusAndEmail(IndexStatus.READY, email)
                : boardRepository.findIdsByIndexStatus(IndexStatus.READY);

        RagChatRes res = ragClient.chat(new RagChatReq(question, allowed)); // ④ 502 가능

        // ⑤ 돌아온 출처가 허용목록에 있는지 한 번 더 확인 (세 번째 안전장치)
        Set<Long> allowSet = new HashSet<>(allowed);
        List<RagSource> sources = res.sources() == null ? List.of()
                : res.sources().stream().filter(s -> allowSet.contains(s.boardId())).toList();
        return new RagChatRes(res.answer(), res.abstained(), res.finalQuery(), sources, res.trace());
    }
}
