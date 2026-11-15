import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "styled-components";
import App from "./App";
import theme from "./styles/theme";
import GlobalStyle from "./styles/GlobalStyle";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css"; // 한글 글꼴 (npm 패키지)
import { AuthProvider } from "./context/AuthContext";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

reportWebVitals();
