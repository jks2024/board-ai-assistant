package com.boardai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class MemberResDto {
    private Long id;
    private String email;
    private String name;
    private String image;
    private String authority;   // ROLE_USER / ROLE_ADMIN (관리자 메뉴 표시용)
    private String provider;    // LOCAL / KAKAO
    private LocalDateTime regDate;
}
