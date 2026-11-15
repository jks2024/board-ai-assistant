import styled from "styled-components";

const Wrap = styled.nav`
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 20px;
`;

const PageBtn = styled.button`
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border-radius: ${({ theme }) => theme.radius.control};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.color.ink : "transparent")};
  background: ${({ $active, theme }) => ($active ? theme.color.ink : "transparent")};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.sub)};
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  &:disabled { opacity: 0.35; cursor: default; }
  &:hover:not(:disabled) { border-color: ${({ theme }) => theme.color.ink}; }
`;

// page 는 0부터 (Spring Data 와 같음), 화면에는 1부터 표시
const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  return (
    <Wrap aria-label="페이지">
      <PageBtn disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="이전 페이지">‹</PageBtn>
      {pages.map((p) => (
        <PageBtn key={p} $active={p === page} aria-current={p === page ? "page" : undefined} onClick={() => onChange(p)}>
          {p + 1}
        </PageBtn>
      ))}
      <PageBtn disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} aria-label="다음 페이지">›</PageBtn>
    </Wrap>
  );
};

export default Pagination;
