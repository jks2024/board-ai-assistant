import styled from "styled-components";

export const fieldStyle = ({ theme }) => `
  width: 100%;
  padding: 12px 14px;
  font-size: ${theme.size.md};
  background: ${theme.color.sheet};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.control};
  outline: none;
  &::placeholder { color: ${theme.color.muted}; }
  &:focus { border-color: ${theme.color.ink}; box-shadow: 0 0 0 3px rgba(30, 42, 85, 0.12); }
`;

const StyledInput = styled.input`
  ${fieldStyle}
`;

export const TextArea = styled.textarea`
  ${fieldStyle}
  min-height: 120px;
  line-height: 1.7;
  resize: vertical;
`;

// type을 props로 받아야 비밀번호 칸을 type="password"로 쓸 수 있음
const Input = ({ type = "text", ...rest }) => <StyledInput type={type} {...rest} />;

export default Input;
