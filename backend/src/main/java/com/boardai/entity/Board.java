package com.boardai.entity;

import com.boardai.constant.IndexStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "board")
@Getter @Setter
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_id")
    private Long id;  // PK는 자동 증가

    @Lob
    @Column(length = 10000)
    private String content;  // 게시글 내용

    @Column(length = 100, nullable = false)
    private String title;   // 게시글 제목

    @Column(nullable = false)
    private int viewCount = 0;

    public void increaseViewCount() {
        this.viewCount++;
    }

    private LocalDateTime regTime;  // 작성일
    @PrePersist
    public void prePersist() {
        this.regTime = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY) // 다대일 관계, 지연 전략
    @JoinColumn(name = "member_id")  // 외래키
    private Member member;  // 작성자 객체를 가져옴

    // ── RAG 색인 상태 (Part 2) ──────────────────────────────
    // null = 미색인(AI 기능을 붙이기 전에 쓴 글), INDEXING → READY | FAILED
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private IndexStatus indexStatus;

    @Column(length = 500)
    private String indexError;        // 실패 사유 (화면에 표시)

    private LocalDateTime indexedAt;  // 마지막으로 색인에 성공한 시각
}
