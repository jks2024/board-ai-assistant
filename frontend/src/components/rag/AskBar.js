import { useState } from "react";
import styled from "styled-components";

// "게시판에 물어보기" 입력창 - 메인과 AI 도우미 화면에서 함께 사용
const Form = styled.form`
  display: flex;
  gap: 8px;
  padding: 6px;
  background: ${({ theme }) => theme.color.sheet};
  border: 2px solid ${({ theme }) => theme.color.ink};
  border-radius: 12px;
  &:focus-within { box-shadow: 0 0 0 4px rgba(255, 224, 102, 0.7); }
`;

const Field = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: none;
  outline: none;
  font-size: ${({ theme }) => theme.size.lg};
  background: transparent;
  &::placeholder { color: ${({ theme }) => theme.color.muted}; }
  &:focus-visible { outline: none; }
`;

const Submit = styled.button`
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  background: ${({ theme }) => theme.color.ink};
  color: #fff;
  font-weight: 700;
  font-size: ${({ theme }) => theme.size.md};
  cursor: pointer;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const AskBar = ({ onAsk, loading = false, initial = "", placeholder = "게시판에 물어보세요. 예) 스터디 모임은 언제 하나요?", extra }) => {
  const [q, setQ] = useState(initial);
  const submit = (e) => {
    e.preventDefault();
    if (q.trim() && !loading) onAsk(q.trim());
  };
  return (
    <Form onSubmit={submit} role="search">
      <Field
        value={q}
        maxLength={500}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="AI 도우미에게 질문"
      />
      {extra}
      <Submit type="submit" disabled={!q.trim() || loading}>
        {loading ? "찾는 중…" : "질문하기"}
      </Submit>
    </Form>
  );
};

export default AskBar;
