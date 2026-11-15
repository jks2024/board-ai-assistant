import styled from "styled-components";

// LangGraph 가 지나간 노드를 경로로 보여 줍니다. 분기가 눈에 보이도록 색을 나눕니다.
export const NODE = {
  retrieve: { label: "검색", color: "#5D6680" },
  grade: { label: "근거 평가", color: "#5D6680" },
  rewrite: { label: "질문 재작성", color: "#2F5BEA" },
  generate: { label: "답변 생성", color: "#1E8A5A" },
  abstain: { label: "답변 보류", color: "#C9711A" },
  format: { label: "정리", color: "#5D6680" },
};

const Path = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 0;
`;

const Step = styled.li`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.size.xs};
  font-weight: 700;
  span {
    padding: 4px 9px;
    border-radius: ${({ theme }) => theme.radius.pill};
    color: ${({ $c }) => $c};
    background: ${({ $c }) => $c}14;
    border: 1px solid ${({ $c }) => $c}40;
  }
  & + &::before {
    content: "";
    width: 14px;
    height: 2px;
    background: ${({ theme }) => theme.color.line};
  }
`;

const TraceView = ({ trace = [] }) => (
  <Path aria-label="실행 경로">
    {trace.map((t, i) => {
      const n = NODE[t] || { label: t, color: "#5D6680" };
      return (
        <Step key={`${t}-${i}`} $c={n.color}>
          <span>{n.label}</span>
        </Step>
      );
    })}
  </Path>
);

export default TraceView;
