package com.boardai.dto;

import com.boardai.constant.IndexStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class BoardResDto {
    private Long boardId;
    private String title;
    private String content;
    private String email;
    private String name;
    private int viewCount;
    private long commentCount;
    private LocalDateTime regDate;
    private IndexStatus indexStatus;   // null 이면 미색인
    private String indexError;
}
