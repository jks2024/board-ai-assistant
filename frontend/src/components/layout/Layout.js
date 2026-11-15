import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../context/AuthContext";

/* 모든 화면이 공유하는 틀: 헤더(로고·메뉴·사용자) + 본문(Outlet) + 푸터 */
const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${({ theme }) => theme.color.ink};
  color: #fff;
`;

const Bar = styled.div`
  max-width: ${({ theme }) => theme.width};
  margin: 0 auto;
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 28px;
  @media (max-width: 640px) { gap: 10px; padding: 0 14px; }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  font-weight: 700;
  font-size: ${({ theme }) => theme.size.lg};
  letter-spacing: -0.02em;
  white-space: nowrap;
  @media (max-width: 640px) { span.text { display: none; } }
`;

/* 로고: 번호 탭 모양 '#' + 형광펜 점 */
const Mark = styled.span`
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: #fff;
  color: ${({ theme }) => theme.color.ink};
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 17px;
  &::after {
    content: "";
    position: absolute;
    right: -3px;
    bottom: -3px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: ${({ theme }) => theme.color.highlight};
    border: 2px solid ${({ theme }) => theme.color.ink};
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 4px;
  flex: 1;
  a {
    padding: 8px 12px;
    border-radius: ${({ theme }) => theme.radius.control};
    text-decoration: none;
    color: rgba(255, 255, 255, 0.72);
    font-weight: 600;
    font-size: ${({ theme }) => theme.size.md};
  }
  a:hover { color: #fff; }
  a.active { color: #fff; background: rgba(255, 255, 255, 0.12); }
  a { white-space: nowrap; }
  @media (max-width: 640px) { a { padding: 8px; font-size: 14px; } }
`;

const User = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.size.sm};
  white-space: nowrap;
  @media (max-width: 640px) { span.name, span.role { display: none; } }
`;

const Avatar = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: ${({ theme }) => theme.color.highlight};
  color: ${({ theme }) => theme.color.ink};
  font-weight: 800;
`;

const Role = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid rgba(255, 255, 255, 0.4);
  font-size: ${({ theme }) => theme.size.xs};
`;

const HeaderBtn = styled.button`
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radius.control};
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: transparent;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.12); }
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.width};
  margin: 0 auto;
  padding: 32px 20px 56px;
`;

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.color.line};
  color: ${({ theme }) => theme.color.muted};
  font-size: ${({ theme }) => theme.size.sm};
  div {
    max-width: ${({ theme }) => theme.width};
    margin: 0 auto;
    padding: 18px 20px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const Layout = () => {
  const { isLogin, me, isAdmin, logout } = useAuth();
  const nav = useNavigate();
  const name = me?.name || localStorage.getItem("email") || "";

  const onLogout = async () => {
    await logout();
    nav("/", { replace: true });
  };

  return (
    <Shell>
      <Header>
        <Bar>
          <Logo to="/">
            <Mark aria-hidden>#</Mark>
            <span className="text">게시판 AI 도우미</span>
          </Logo>
          <Nav>
            <NavLink to="/" end>게시판</NavLink>
            <NavLink to="/ai">AI 도우미</NavLink>
          </Nav>
          {isLogin ? (
            <User>
              <Avatar aria-hidden>{name.charAt(0).toUpperCase()}</Avatar>
              <span className="name">{name}</span>
              {isAdmin && <Role className="role">관리자</Role>}
              <HeaderBtn onClick={onLogout}>로그아웃</HeaderBtn>
            </User>
          ) : (
            <HeaderBtn onClick={() => nav("/login")}>로그인</HeaderBtn>
          )}
        </Bar>
      </Header>
      <Main>
        <Outlet />
      </Main>
      <Footer>
        <div>
          <span>게시판 글을 근거로, 출처를 붙여, 권한 안에서 답합니다.</span>
          <span>React · Spring Boot · FastAPI · LangGraph</span>
        </div>
      </Footer>
    </Shell>
  );
};

export default Layout;
