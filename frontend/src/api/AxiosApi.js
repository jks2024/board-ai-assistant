import AxiosInstance from "./AxiosInstance";

// 화면 코드는 토큰을 몰라도 됩니다. 첨부·재발급은 AxiosInstance 인터셉터가 처리합니다.
const AxiosApi = {
  // ── auth ──
  memberExist: (email) => AxiosInstance.get(`/auth/exists/${encodeURIComponent(email)}`),
  memberSignup: (email, pwd, name) => AxiosInstance.post("/auth/signup", { email, pwd, name }),
  memberLogin: (email, pwd) => AxiosInstance.post("/auth/login", { email, pwd }),
  memberLogout: () => AxiosInstance.post("/auth/logout"),
  kakaoLogin: (code) => AxiosInstance.post("/auth/kakao", { code }),

  // ── member ──
  memberMe: () => AxiosInstance.get("/member/me"),

  // ── board ──
  boardWrite: (title, content) => AxiosInstance.post("/board/write", { title, content }),
  boardList: () => AxiosInstance.get("/board/list"),
  boardPage: (page = 0, size = 10) => AxiosInstance.get("/board/list/page", { params: { page, size } }),
  boardSearch: (keyword, page = 0, size = 10) =>
    AxiosInstance.get("/board/search", { params: { keyword, page, size } }),
  boardDetail: (id) => AxiosInstance.get(`/board/${id}`),
  boardModify: (id, title, content) => AxiosInstance.put(`/board/${id}`, { title, content }),
  boardDelete: (id) => AxiosInstance.delete(`/board/${id}`),

  // ── comment ──
  commentWrite: (boardId, content) => AxiosInstance.post("/comment/write", { boardId, content }),
  commentList: (boardId) => AxiosInstance.get(`/comment/list/${boardId}`),
  commentModify: (commentId, content) => AxiosInstance.put(`/comment/${commentId}`, { content }),
  commentDelete: (commentId) => AxiosInstance.delete(`/comment/${commentId}`),

  // ── RAG (AI 도우미) ──
  // scope: "all"(전체 글) | "mine"(내 글만 - 기준은 서버가 JWT 에서 꺼낸 사용자)
  ragChat: (question, scope = "all") => AxiosInstance.post("/rag/chat", { question, scope }),
  ragReindex: (boardId) => AxiosInstance.post(`/rag/reindex/${boardId}`),
  adminReindexAll: () => AxiosInstance.post("/admin/rag/reindex"),
};

export default AxiosApi;
