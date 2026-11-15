import styled, { css } from "styled-components";

// variant: primary(잉크) | secondary(테두리) | danger(빨강) | ghost(글자만)
const StyledBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: ${({ $size }) => ($size === "sm" ? "34px" : "46px")};
  padding: 0 ${({ $size }) => ($size === "sm" ? "12px" : "18px")};
  width: ${({ $block }) => ($block ? "100%" : "auto")};
  font-size: ${({ $size, theme }) => ($size === "sm" ? theme.size.sm : theme.size.md)};
  font-weight: 700;
  border-radius: ${({ theme }) => theme.radius.control};
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;

  ${({ $variant, theme }) =>
    ({
      primary: css`
        background: ${theme.color.ink};
        color: #fff;
        &:hover:not(:disabled) { background: ${theme.color.inkSoft}; }
      `,
      secondary: css`
        background: ${theme.color.sheet};
        color: ${theme.color.ink};
        border-color: ${theme.color.line};
        &:hover:not(:disabled) { border-color: ${theme.color.ink}; }
      `,
      danger: css`
        background: ${theme.color.sheet};
        color: ${theme.color.failed};
        border-color: ${theme.color.line};
        &:hover:not(:disabled) { border-color: ${theme.color.failed}; }
      `,
      ghost: css`
        background: transparent;
        color: ${theme.color.sub};
        &:hover:not(:disabled) { color: ${theme.color.ink}; }
      `,
    })[$variant]}

  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

// 예전 코드 호환: enabled 를 주면 그 값으로 disabled 결정
const Button = ({ enabled = true, variant = "primary", size, block, onClick, children, type = "button", ...rest }) => (
  <StyledBtn
    type={type}
    $variant={variant}
    $size={size}
    $block={block}
    disabled={!enabled}
    onClick={onClick}
    {...rest}
  >
    {children}
  </StyledBtn>
);

export default Button;
