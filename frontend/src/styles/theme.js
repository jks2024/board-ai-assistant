// 디자인 토큰 - 색·글꼴·간격을 한곳에서 관리합니다.
// 콘셉트: "색인 카드 서랍" - 글마다 번호 탭이 있고, AI 인용 [#n]은 형광펜으로 표시합니다.
const theme = {
  color: {
    ink: "#1E2A55", // 주 색 (헤더 로고, 번호 탭, 주요 버튼)
    inkSoft: "#3B4775",
    paper: "#F2F4F8", // 바탕
    sheet: "#FFFFFF", // 목록·본문 판
    line: "#E1E5EE", // 구분선
    text: "#1B2033",
    sub: "#5D6680",
    muted: "#8A93A6",
    highlight: "#FFE066", // 형광펜 (인용 표시)
    ready: "#1E8A5A",
    indexing: "#2F5BEA",
    failed: "#D14343",
    kakao: "#FEE500",
  },
  radius: { sheet: "10px", control: "8px", pill: "999px" },
  font: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`,
  // 1.25 배율 글자 크기
  size: { xs: "12px", sm: "13px", md: "15px", lg: "18px", xl: "22px", xxl: "28px", hero: "34px" },
  width: "1080px",
};

export default theme;
