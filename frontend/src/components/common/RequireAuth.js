import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// 로그인이 필요한 화면을 감쌉니다. 로그인 후 원래 가려던 곳으로 돌아오도록 from 을 넘김
const RequireAuth = () => {
  const { isLogin } = useAuth();
  const location = useLocation();
  if (!isLogin) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
};

export default RequireAuth;
