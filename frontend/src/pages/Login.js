import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import AuthShell, { AuthCard, BottomText } from "../components/layout/AuthShell";
import AxiosApi from "../api/AxiosApi";
import { errorMessage } from "../api/AxiosInstance";
import { useAuth } from "../context/AuthContext";

const KakaoBtn = styled.button`
  height: 46px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.kakao};
  color: #191919;
  font-weight: 700;
  cursor: pointer;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.color.muted};
  font-size: ${({ theme }) => theme.size.xs};
  &::before, &::after { content: ""; flex: 1; height: 1px; background: ${({ theme }) => theme.color.line}; }
`;

// 카카오 인가 코드 요청 주소 (client_id = REST API 키, 공개돼도 되는 값)
const KAKAO_AUTH_URL =
  "https://kauth.kakao.com/oauth/authorize?response_type=code" +
  `&client_id=${process.env.REACT_APP_KAKAO_CLIENT_ID}` +
  "&redirect_uri=" +
  encodeURIComponent(process.env.REACT_APP_KAKAO_REDIRECT_URI || "http://localhost:3000/oauth/kakao");

const Login = () => {
  const [inputEmail, setInputEmail] = useState("");
  const [inputPwd, setInputPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || "/";

  const isValid = inputEmail.trim() !== "" && inputPwd !== "";

  // form 의 onSubmit 으로 처리하면 Enter 키로도 로그인 가능
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await AxiosApi.memberLogin(inputEmail, inputPwd);
      await login(data, inputEmail);
      nav(from, { replace: true }); // 뒤로가기로 로그인 화면에 다시 오지 않도록
    } catch (err) {
      alert(errorMessage(err, "이메일 또는 비밀번호가 올바르지 않습니다."));
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard onSubmit={onSubmit}>
        <h2>로그인</h2>
        <p className="sub">AI 도우미에게 질문하려면 로그인하세요.</p>
        <Input type="email" value={inputEmail} placeholder="이메일" aria-label="이메일" autoComplete="email"
               onChange={(e) => setInputEmail(e.target.value)} />
        <Input type="password" value={inputPwd} placeholder="비밀번호" aria-label="비밀번호" autoComplete="current-password"
               onChange={(e) => setInputPwd(e.target.value)} />
        <Button type="submit" block enabled={isValid && !loading}>{loading ? "로그인 중…" : "로그인"}</Button>
        <Divider>또는</Divider>
        <KakaoBtn type="button" onClick={() => (window.location.href = KAKAO_AUTH_URL)}>카카오로 로그인</KakaoBtn>
        <BottomText>
          계정이 없으신가요?<Link to="/signup">회원가입</Link>
        </BottomText>
      </AuthCard>
    </AuthShell>
  );
};

export default Login;
