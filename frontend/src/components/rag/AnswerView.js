import { Fragment } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import TraceView from "./TraceView";

const Card = styled.article`
  background: ${({ theme }) => theme.color.sheet};
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.sheet};
  overflow: hidden;
`;

const Question = styled.p`
  margin: 0;
  padding: 14px 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.ink};
  background: #f7f8fb;
  border-bottom: 1px solid ${({ theme }) => theme.color.line};
  &::before { content: "Q. "; color: ${({ theme }) => theme.color.muted}; }
`;

const Answer = styled.p`
  margin: 0;
  padding: 18px 20px 14px;
  font-size: ${({ theme }) => theme.size.lg};
  line-height: 1.75;
  white-space: pre-wrap;
  color: ${({ $abstained, theme }) => ($abstained ? theme.color.sub : theme.color.text)};
`;

/* 인용 [#n] = 형광펜. 누르면 원문 게시글로 이동해 사람이 직접 확인 */
const Cite = styled(Link)`
  display: inline-block;
  margin: 0 2px;
  padding: 0 4px;
  font-size: 0.82em;
  font-weight: 800;
  text-decoration: none;
  color: ${({ theme }) => theme.color.ink};
  background: linear-gradient(transparent 35%, ${({ theme }) => theme.color.highlight} 35%);
  &:hover { background: ${({ theme }) => theme.color.highlight}; }
`;

const Section = styled.div`
  padding: 12px 20px 16px;
  border-top: 1px dashed ${({ theme }) => theme.color.line};
  h4 {
    margin: 0 0 8px;
    font-size: ${({ theme }) => theme.size.sm};
    color: ${({ theme }) => theme.color.sub};
  }
`;

const Sources = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
`;

const SourceRow = styled.li`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: baseline;
  font-size: ${({ theme }) => theme.size.sm};
  a { font-weight: 700; color: ${({ theme }) => theme.color.ink}; text-decoration: none; }
  a:hover { text-decoration: underline; }
  small { color: ${({ theme }) => theme.color.muted}; white-space: nowrap; font-variant-numeric: tabular-nums; }
  p { grid-column: 2 / 4; margin: 0; color: ${({ theme }) => theme.color.sub}; font-size: ${({ theme }) => theme.size.xs}; }
`;

const Num = styled.span`
  font-weight: 800;
  color: ${({ theme }) => theme.color.ink};
  font-variant-numeric: tabular-nums;
`;

const Rewritten = styled.p`
  margin: 8px 0 0;
  font-size: ${({ theme }) => theme.size.xs};
  color: ${({ theme }) => theme.color.indexing};
`;

// "… 모입니다 [#1]" → 텍스트와 인용 링크로 나누기
const renderAnswer = (text) =>
  text.split(/(\[#\d+\])/g).map((part, i) => {
    const m = part.match(/^\[#(\d+)\]$/);
    return m ? (
      <Cite key={i} to={`/board/${m[1]}`} title={`게시글 #${m[1]} 열기`}>#{m[1]}</Cite>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    );
  });

const AnswerView = ({ item }) => {
  const { question, answer, abstained, sources = [], trace = [], finalQuery } = item;
  return (
    <Card>
      <Question>{question}</Question>
      <Answer $abstained={abstained}>{renderAnswer(answer)}</Answer>
      {sources.length > 0 && (
        <Section>
          <h4>출처 게시글</h4>
          <Sources>
            {sources.map((s) => (
              <SourceRow key={s.boardId}>
                <Num>#{s.boardId}</Num>
                <Link to={`/board/${s.boardId}`}>{s.title}</Link>
                <small>{s.ownerName} · 유사도 {Number(s.score).toFixed(2)}</small>
                <p>{s.snippet}</p>
              </SourceRow>
            ))}
          </Sources>
        </Section>
      )}
      <Section>
        <h4>실행 경로</h4>
        <TraceView trace={trace} />
        {trace.includes("rewrite") && finalQuery && finalQuery !== question && (
          <Rewritten>재작성한 검색어: “{finalQuery}”</Rewritten>
        )}
      </Section>
    </Card>
  );
};

export default AnswerView;
