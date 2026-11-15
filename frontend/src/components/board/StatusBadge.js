import styled from "styled-components";

// 색인 상태 도장: READY 인 글만 AI 검색 대상
const LABEL = {
  READY: "검색 가능",
  INDEXING: "색인 중",
  FAILED: "색인 실패",
  NONE: "미색인",
};

const Stamp = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.size.xs};
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $c }) => $c};
  border: 1px solid ${({ $c }) => $c}55;
  background: ${({ $c }) => $c}0F;
  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $c }) => $c};
  }
`;

const StatusBadge = ({ status }) => {
  const key = status || "NONE";
  const colors = { READY: "#1E8A5A", INDEXING: "#2F5BEA", FAILED: "#D14343", NONE: "#8A93A6" };
  return (
    <Stamp $c={colors[key]} title={key === "READY" ? "AI 도우미가 이 글을 근거로 답할 수 있습니다" : undefined}>
      {LABEL[key]}
    </Stamp>
  );
};

export default StatusBadge;
