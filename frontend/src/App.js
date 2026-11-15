import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import RequireAuth from "./components/common/RequireAuth";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import KakaoCallback from "./pages/KakaoCallback";
import BoardList from "./pages/boards/BoardList";
import BoardWrite from "./pages/boards/BoardWrite";
import BoardDetail from "./pages/boards/BoardDetail";
import AiAssistant from "./pages/rag/AiAssistant";
import NotFound from "./pages/NotFound";

// 메인(/)은 게시글 목록입니다. 목록·상세는 로그인 없이 볼 수 있고,
// 글쓰기·AI 도우미는 RequireAuth 가 로그인 화면으로 보냅니다.
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth/kakao" element={<KakaoCallback />} />
        <Route element={<Layout />}>
          <Route path="/" element={<BoardList />} />
          <Route path="/board" element={<Navigate to="/" replace />} />
          <Route path="/board/:boardId" element={<BoardDetail />} />
          <Route element={<RequireAuth />}>
            <Route path="/board/write" element={<BoardWrite />} />
            <Route path="/board/:boardId/edit" element={<BoardWrite />} />
            <Route path="/ai" element={<AiAssistant />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
