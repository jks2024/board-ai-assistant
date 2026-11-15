package com.boardai.repository;

import com.boardai.constant.IndexStatus;
import com.boardai.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {
    @EntityGraph(attributePaths = "member")   // 작성자를 함께 조회 (N+1 방지)
    List<Board> findAllByOrderByRegTimeDesc();

    @EntityGraph(attributePaths = "member")
    Page<Board> findAll(Pageable pageable);

    // 제목 또는 내용에 키워드가 포함된 게시글 (페이지네이션)
    // SQL : where title like %?% or content like %?%
    @EntityGraph(attributePaths = "member")
    Page<Board> findByTitleContainingOrContentContaining(String title, String content, Pageable pageable);

    // ── RAG 허용목록: READY 인 글의 id 만 ──
    @Query("select b.id from Board b where b.indexStatus = :status")
    List<Long> findIdsByIndexStatus(@Param("status") IndexStatus status);

    // "내 글만": 토큰에서 꺼낸 이메일의 글 중 READY
    @Query("select b.id from Board b where b.indexStatus = :status and b.member.email = :email")
    List<Long> findIdsByIndexStatusAndEmail(@Param("status") IndexStatus status, @Param("email") String email);

    @Query("select b.id from Board b order by b.id")
    List<Long> findAllIds();

    // 색인 결과 기록 (REQUIRES_NEW 트랜잭션에서 호출)
    @Modifying(clearAutomatically = true)
    @Query("update Board b set b.indexStatus = :status, b.indexError = :error, b.indexedAt = :at where b.id = :id")
    int updateIndexStatus(@Param("id") Long id, @Param("status") IndexStatus status,
                          @Param("error") String error, @Param("at") LocalDateTime at);
}
