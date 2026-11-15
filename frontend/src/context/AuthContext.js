import { createContext, useCallback, useContext, useEffect, useState } from "react";
import AxiosApi from "../api/AxiosApi";
import { clearAuth } from "../api/AxiosInstance";

// 로그인 상태를 여러 화면(헤더·글 상세·AI 도우미)이 함께 쓰도록 Context 로 공유
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLogin, setIsLogin] = useState(localStorage.getItem("isLogin") === "TRUE");
  const [me, setMe] = useState(null); // { email, name, authority, ... }

  const loadMe = useCallback(async () => {
    if (localStorage.getItem("isLogin") !== "TRUE") return;
    try {
      const { data } = await AxiosApi.memberMe();
      setMe(data);
    } catch (e) {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  // 로그인 성공 (일반·카카오 공통)
  const login = useCallback(
    async (tokens, email) => {
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      localStorage.setItem("email", email);
      localStorage.setItem("isLogin", "TRUE");
      setIsLogin(true);
      await loadMe();
    },
    [loadMe],
  );

  // 로그아웃: 서버의 Refresh 삭제 → 저장 값 정리
  const logout = useCallback(async () => {
    try {
      await AxiosApi.memberLogout();
    } catch (e) {
      // 토큰이 이미 만료됐어도 화면에서는 로그아웃 처리
    }
    clearAuth();
    setIsLogin(false);
    setMe(null);
  }, []);

  const value = {
    isLogin,
    me,
    email: localStorage.getItem("email"),
    isAdmin: me?.authority === "ROLE_ADMIN",
    login,
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
