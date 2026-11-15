import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    font-family: ${({ theme }) => theme.font};
    font-size: ${({ theme }) => theme.size.md};
    line-height: 1.6;
    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.paper};
    -webkit-font-smoothing: antialiased;
    word-break: keep-all;          /* 한국어 단어 중간에서 줄바꿈하지 않음 */
  }
  a { color: inherit; }
  button, input, textarea, select { font: inherit; color: inherit; }
  :focus-visible { outline: 3px solid ${({ theme }) => theme.color.indexing}; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`;

export default GlobalStyle;
