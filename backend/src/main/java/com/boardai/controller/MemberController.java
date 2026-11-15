package com.boardai.controller;

import com.boardai.dto.MemberResDto;
import com.boardai.dto.MemberUpdateReqDto;
import com.boardai.dto.PageResDto;
import com.boardai.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService;

    // 회원 전체 조회
    @GetMapping("/list")
    public ResponseEntity<List<MemberResDto>> memberList() {
        return ResponseEntity.ok(memberService.getMemberList());
    }

    // 내 정보 : GET http://localhost:8111/member/me  (헤더의 이름·관리자 메뉴 표시용)
    @GetMapping("/me")
    public ResponseEntity<MemberResDto> me() {
        return ResponseEntity.ok(memberService.getMe());
    }

    // 회원 상세 조회 : GET http://localhost:8111/member/{email}
    @GetMapping("/{email}")
    public ResponseEntity<MemberResDto> memberDetail(@PathVariable String email) {
        try {
            return ResponseEntity.ok(memberService.getMemberDetail(email));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();  // 404
        }
    }

    // 회원 수정 : PUT http://localhost:8111/member/modify
    @PutMapping("/modify")
    public ResponseEntity<Boolean> memberModify(@RequestBody MemberUpdateReqDto dto) {
        return ResponseEntity.ok(memberService.updateMember(dto));
    }

    // 회원 삭제 : DELETE http://localhost:8111/member/{email}
    @DeleteMapping("/{email}")
    public ResponseEntity<Boolean> memberDelete(@PathVariable String email) {
        return ResponseEntity.ok(memberService.deleteMember(email));
    }

    // 회원 목록 페이지네이션 조회
    // GET http://localhost:8111/member/list/page?page=0&size=10
    @GetMapping("/list/page")
    public ResponseEntity<PageResDto<MemberResDto>> memberListPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(memberService.getMemberPage(page, size));
    }
}
