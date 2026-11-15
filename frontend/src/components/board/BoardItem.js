import styled from "styled-components";
import StatusBadge from "./StatusBadge";

// 목록의 한 줄: 왼쪽 번호 탭(#글번호) + 제목·요약·작성 정보 + 색인 상태
const Row = styled.li`
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 16px;
  align-items: start;
  padding: 18px 20px;
  border-top: 1px solid ${({ theme }) => theme.color.line};
  cursor: pointer;
  &:first-child { border-top: none; }
  &:hover { background: #f8f9fc; }
  &:hover h3 { color: ${({ theme }) => theme.color.indexing}; }
  @media (max-width: 640px) {
    grid-template-columns: 48px 1fr;
    > :last-child { grid-column: 2; justify-self: start; }
  }
`;

const Tab = styled.span`
  font-size: ${({ theme }) => theme.size.lg};
  font-weight: 800;
  color: ${({ theme }) => theme.color.ink};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  padding-top: 1px;
  &::before { content: "#"; color: ${({ theme }) => theme.color.muted}; font-weight: 600; margin-right: 1px; }
`;

const Body = styled.div`
  min-width: 0;
`;

const Title = styled.h3`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.size.lg};
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Excerpt = styled.p`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.color.sub};
  font-size: ${({ theme }) => theme.size.sm};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.div`
  display: flex;
  gap: 14px;
  font-size: ${({ theme }) => theme.size.xs};
  color: ${({ theme }) => theme.color.muted};
  b { color: ${({ theme }) => theme.color.sub}; font-weight: 600; }
`;

const BoardItem = ({ board, onClick }) => (
  <Row onClick={() => onClick(board.boardId)} tabIndex={0}
       onKeyDown={(e) => e.key === "Enter" && onClick(board.boardId)}>
    <Tab>{board.boardId}</Tab>
    <Body>
      <Title>{board.title}</Title>
      <Excerpt>{board.content}</Excerpt>
      <Meta>
        <b>{board.name || board.email}</b>
        <span>{board.regDate?.substring(0, 10)}</span>
        <span>조회 {board.viewCount}</span>
        <span>댓글 {board.commentCount}</span>
      </Meta>
    </Body>
    <StatusBadge status={board.indexStatus} />
  </Row>
);

export default BoardItem;
