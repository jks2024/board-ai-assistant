package com.boardai.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/*
 * 모든 오류를 { "message": "...", "code": "..." } 한 가지 모양으로 응답합니다.
 * ErrorResponse 생성자 순서: (message, code)
 * 처리기는 선언 순서가 아니라 "가장 구체적인 예외 타입"이 선택됩니다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 400: 필수 파라미터 누락
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("필수 파라미터가 누락되었습니다: " + ex.getParameterName(), "MISSING_PARAM"));
    }

    // 400: JSON 본문 형식 오류, 경로 변수 타입 오류 (/board/abc)
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception ex) {
        log.warn("잘못된 요청 형식: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(new ErrorResponse("요청 형식이 올바르지 않습니다.", "BAD_REQUEST"));
    }

    // 405: HTTP 메서드를 잘못 호출 (예: 회원 가입을 GET 으로)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        log.warn("지원하지 않는 메서드: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ErrorResponse("지원하지 않는 요청 방식입니다: " + ex.getMethod(), "METHOD_NOT_ALLOWED"));
    }

    // 404: 없는 주소
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("요청한 주소를 찾을 수 없습니다.", "NOT_FOUND"));
    }

    // 500: DB 오류 (원인은 로그로만)
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDBError(DataAccessException ex) {
        log.error("DB 오류: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("데이터베이스 오류가 발생했습니다.", "DB_ERROR"));
    }

    // 상태 코드를 직접 지정한 예외 (400/401/403/409, RAG 502 등)
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustom(CustomException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ErrorResponse(ex.getMessage(), ex.getCode()));
    }

    // 404: 대상 없음 (기존 IllegalAccessException 오타 → IllegalArgumentException)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("잘못된 요청: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(ex.getMessage(), "NOT_FOUND"));
    }

    // 500: 그 밖의 모든 예외
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleDefault(Exception ex) {
        log.error("알 수 없는 오류", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("알 수 없는 서버 오류가 발생했습니다.", "UNKNOWN"));
    }
}
