package com.boardai.rag;

import com.boardai.rag.dto.RagChatReq;
import com.boardai.rag.dto.RagChatRes;
import com.boardai.rag.dto.RagIndexReq;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.function.Supplier;

/*
 * FastAPI(rag-ai-service) 호출 전담 클래스
 * - 모든 요청에 X-Service-Token 헤더를 붙여 "Spring 이 부른 요청"임을 증명합니다.
 * - 연결 실패·오류 응답은 모두 RagUnavailableException(502)으로 바꿉니다.
 */
@Slf4j
@Component
public class RagClient {
    private final RestClient restClient;

    public RagClient(RagProperties props) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(props.connectTimeoutMs()));
        factory.setReadTimeout(Duration.ofMillis(props.readTimeoutMs()));
        this.restClient = RestClient.builder()
                .baseUrl(props.baseUrl())
                .requestFactory(factory)
                .defaultHeader("X-Service-Token", props.serviceToken())
                .build();
    }

    // 색인 (같은 boardId 가 있으면 FastAPI 가 기존 청크를 지우고 다시 넣음)
    public void index(RagIndexReq req) {
        call(() -> restClient.post().uri("/index")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .toBodilessEntity());
    }

    // 색인 삭제
    public void delete(Long boardId) {
        call(() -> restClient.delete().uri("/index/{boardId}", boardId)
                .retrieve()
                .toBodilessEntity());
    }

    // 질문
    public RagChatRes chat(RagChatReq req) {
        return call(() -> restClient.post().uri("/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .body(RagChatRes.class));
    }

    private <T> T call(Supplier<T> request) {
        try {
            return request.get();
        } catch (ResourceAccessException e) {          // 연결 거부·시간 초과 (FastAPI 꺼짐)
            log.warn("AI 서비스 연결 실패: {}", e.getMessage());
            throw new RagUnavailableException("AI 서비스에 연결할 수 없습니다.");
        } catch (RestClientResponseException e) {      // FastAPI 가 4xx/5xx 응답
            HttpStatusCode status = e.getStatusCode();
            log.warn("AI 서비스 오류 {}: {}", status, e.getResponseBodyAsString());
            String reason = status.value() == 401 ? "서비스 토큰이 일치하지 않습니다(SERVICE_TOKEN 확인)."
                    : "AI 서비스 오류 (" + status.value() + ")";
            throw new RagUnavailableException(reason);
        } catch (RestClientException e) {
            log.warn("AI 서비스 호출 실패: {}", e.getMessage());
            throw new RagUnavailableException("AI 서비스 호출에 실패했습니다.");
        }
    }
}
