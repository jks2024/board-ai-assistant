import { Link } from "react-router-dom";
import styled from "styled-components";

const Box = styled.div`
  text-align: center;
  padding: 80px 20px;
  h1 { margin: 0 0 8px; font-size: 56px; color: ${({ theme }) => theme.color.ink}; letter-spacing: -0.04em; }
  p { color: ${({ theme }) => theme.color.sub}; }
  a { color: ${({ theme }) => theme.color.ink}; font-weight: 700; }
`;

const NotFound = () => (
  <Box>
    <h1>#404</h1>
    <p>없는 페이지입니다. 주소를 확인하거나 <Link to="/">게시판</Link>으로 돌아가세요.</p>
  </Box>
);

export default NotFound;
