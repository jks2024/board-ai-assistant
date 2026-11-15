import { Link } from "react-router-dom";
import styled from "styled-components";

/* 로그인·회원가입 공통 틀: 왼쪽은 서비스 소개(실제 답변 예시), 오른쪽은 입력 폼 */
const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  @media (max-width: 860px) { grid-template-columns: 1fr; }
`;

const Brand = styled.section`
  background: ${({ theme }) => theme.color.ink};
  color: #fff;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  a { color: #fff; text-decoration: none; font-weight: 700; font-size: ${({ theme }) => theme.size.lg}; }
  h1 { margin: auto 0 0; font-size: 38px; line-height: 1.25; letter-spacing: -0.035em; max-width: 14em; }
  p { margin: 0; color: rgba(255, 255, 255, 0.72); max-width: 34em; }
  @media (max-width: 860px) { padding: 28px 24px; h1 { font-size: 26px; } .demo { display: none; } }
`;

/* 실제 화면과 같은 모양의 답변 예시 */
const Demo = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  padding: 18px 20px;
  max-width: 460px;
  font-size: ${({ theme }) => theme.size.md};
  .q { color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; }
  .a { line-height: 1.7; }
  mark {
    background: ${({ theme }) => theme.color.highlight};
    color: ${({ theme }) => theme.color.ink};
    font-weight: 800;
    padding: 0 4px;
    border-radius: 3px;
  }
  .path { margin-top: 12px; font-size: ${({ theme }) => theme.size.xs}; color: rgba(255, 255, 255, 0.55); }
`;

const FormSide = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
`;

export const AuthCard = styled.form`
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  h2 { margin: 0 0 4px; font-size: ${({ theme }) => theme.size.xxl}; letter-spacing: -0.03em; }
  p.sub { margin: 0 0 14px; color: ${({ theme }) => theme.color.sub}; }
`;

export const BottomText = styled.p`
  margin: 8px 0 0;
  text-align: center;
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.sub};
  a { margin-left: 6px; color: ${({ theme }) => theme.color.ink}; font-weight: 700; }
`;

const AuthShell = ({ children }) => (
  <Page>
    <Brand>
      <Link to="/"># 게시판 AI 도우미</Link>
      <h1>게시판에 쓴 글이 그대로 AI의 지식이 됩니다</h1>
      <p>글을 쓰면 자동으로 색인되고, 고치면 다시 색인되고, 지우면 검색에서 빠집니다.</p>
      <Demo className="demo" aria-hidden>
        <div className="q">스터디 모임은 언제 하나요?</div>
        <div className="a">매주 목요일 저녁 7시, 302호에서 모입니다 <mark>#1</mark></div>
        <div className="path">검색 → 근거 평가 → 답변 생성 → 정리</div>
      </Demo>
    </Brand>
    <FormSide>{children}</FormSide>
  </Page>
);

export default AuthShell;
