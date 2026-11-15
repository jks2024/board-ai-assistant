import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import AxiosApi from "../../api/AxiosApi";
import { errorMessage } from "../../api/AxiosInstance";
import Button from "../../components/common/Button";
import { TextArea } from "../../components/common/Input";
import StatusBadge from "../../components/board/StatusBadge";
import { useAuth } from "../../context/AuthContext";

const Wrap = styled.div`
  max-width: 780px;
  margin: 0 auto;
`;

const Back = styled(Link)`
  display: inline-block;
  margin-bottom: 14px;
  color: ${({ theme }) => theme.color.sub};
  font-size: ${({ theme }) => theme.size.sm};
  text-decoration: none;
  &:hover { color: ${({ theme }) => theme.color.ink}; }
`;

const Sheet = styled.article`
  background: ${({ theme }) => theme.color.sheet};
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.sheet};
  padding: 28px 32px;
  margin-bottom: 16px;
  @media (max-width: 640px) { padding: 20px; }
`;

const Head = styled.header`
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
  span.no {
    font-weight: 800;
    font-size: ${({ theme }) => theme.size.xl};
    color: ${({ theme }) => theme.color.muted};
    font-variant-numeric: tabular-nums;
  }
  h1 {
    flex: 1;
    margin: 0;
    font-size: ${({ theme }) => theme.size.xxl};
    line-height: 1.3;
    letter-spacing: -0.03em;
  }
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  padding-bottom: 18px;
  margin-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.color.line};
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.muted};
  b { color: ${({ theme }) => theme.color.text}; }
`;

const Content = styled.div`
  min-height: 160px;
  line-height: 1.85;
  white-space: pre-wrap;
  font-size: 16px;
`;

const IndexPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $failed }) => ($failed ? "#FDF1F1" : "#F5F7FB")};
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.sub};
  span.msg { flex: 1; }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Comments = styled.section`
  background: ${({ theme }) => theme.color.sheet};
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.sheet};
  padding: 22px 32px;
  @media (max-width: 640px) { padding: 18px 20px; }
  h2 { margin: 0 0 14px; font-size: ${({ theme }) => theme.size.lg}; }
  h2 span { color: ${({ theme }) => theme.color.indexing}; margin-left: 4px; }
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 10px;
  textarea { min-height: 80px; }
`;

const LoginHint = styled.p`
  margin: 0 0 10px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.control};
  background: #f5f7fb;
  color: ${({ theme }) => theme.color.sub};
  font-size: ${({ theme }) => theme.size.sm};
  a { color: ${({ theme }) => theme.color.ink}; font-weight: 700; }
`;

const CommentList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  li { padding: 14px 0; border-top: 1px solid ${({ theme }) => theme.color.line}; }
  .meta { display: flex; gap: 10px; align-items: center; font-size: ${({ theme }) => theme.size.sm}; color: ${({ theme }) => theme.color.muted}; margin-bottom: 4px; }
  .meta b { color: ${({ theme }) => theme.color.text}; }
  .meta button { margin-left: auto; }
  p { margin: 0; white-space: pre-wrap; line-height: 1.65; }
`;

const BoardDetail = () => {
  const { boardId } = useParams();
  const nav = useNavigate();
  const { isLogin, email, isAdmin } = useAuth();
  const [board, setBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [reindexing, setReindexing] = useState(false);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await AxiosApi.boardDetail(boardId);
      setBoard(res.data);
    } catch (err) {
      alert(errorMessage(err, "게시글을 불러오지 못했습니다."));
      nav("/", { replace: true });
    }
  }, [boardId, nav]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await AxiosApi.commentList(boardId);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
    fetchComments();
  }, [fetchBoard, fetchComments]);

  if (!board) return <Wrap>불러오는 중…</Wrap>;

  const isWriter = isLogin && board.email === email;

  const onDelete = async () => {
    if (!window.confirm("이 글을 삭제할까요? 댓글도 함께 지워지고 AI 검색에서도 빠집니다.")) return;
    try {
      await AxiosApi.boardDelete(boardId);
      nav("/", { replace: true });
    } catch (err) {
      alert(errorMessage(err, "삭제하지 못했습니다."));
    }
  };

  const onReindex = async () => {
    setReindexing(true);
    try {
      await AxiosApi.ragReindex(boardId);
    } catch (err) {
      alert(errorMessage(err, "재색인하지 못했습니다."));
    }
    await fetchBoard();
    setReindexing(false);
  };

  const onComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await AxiosApi.commentWrite(boardId, text);
      setText("");
      fetchComments();
    } catch (err) {
      alert(errorMessage(err, "댓글을 등록하지 못했습니다."));
    }
  };

  const onCommentDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await AxiosApi.commentDelete(commentId);
      fetchComments();
    } catch (err) {
      alert(errorMessage(err, "댓글을 삭제하지 못했습니다."));
    }
  };

  const status = board.indexStatus;
  const statusText = {
    READY: "AI 도우미가 이 글을 근거로 답할 수 있습니다.",
    INDEXING: "색인하는 중입니다. 끝나면 AI 도우미가 이 글을 찾을 수 있습니다.",
    FAILED: `색인하지 못했습니다: ${board.indexError || "원인 불명"}`,
  }[status] || "아직 색인하지 않은 글입니다. 재색인하면 AI 도우미가 찾을 수 있습니다.";

  return (
    <Wrap>
      <Back to="/">← 목록으로</Back>
      <Sheet>
        <Head>
          <span className="no">#{board.boardId}</span>
          <h1>{board.title}</h1>
        </Head>
        <Meta>
          <b>{board.name || board.email}</b>
          <span>{board.regDate?.substring(0, 16).replace("T", " ")}</span>
          <span>조회 {board.viewCount}</span>
          <StatusBadge status={status} />
        </Meta>
        <Content>{board.content}</Content>

        <IndexPanel $failed={status === "FAILED"}>
          <StatusBadge status={status} />
          <span className="msg">{statusText}</span>
          {(isWriter || isAdmin) && status !== "READY" && (
            <Button size="sm" variant="secondary" enabled={!reindexing} onClick={onReindex}>
              {reindexing ? "재색인 중…" : "재색인"}
            </Button>
          )}
        </IndexPanel>

        {isWriter && (
          <Actions>
            <Button size="sm" variant="secondary" onClick={() => nav(`/board/${boardId}/edit`)}>수정</Button>
            <Button size="sm" variant="danger" onClick={onDelete}>삭제</Button>
          </Actions>
        )}
      </Sheet>

      <Comments>
        <h2>댓글<span>{comments.length}</span></h2>
        {isLogin ? (
          <CommentForm onSubmit={onComment}>
            <TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder="댓글을 남겨 보세요" aria-label="댓글" />
            <Button type="submit" size="sm" enabled={text.trim() !== ""}>댓글 등록</Button>
          </CommentForm>
        ) : (
          <LoginHint><Link to="/login">로그인</Link>하면 댓글을 남길 수 있습니다.</LoginHint>
        )}
        <CommentList>
          {comments.map((c) => (
            <li key={c.commentId}>
              <div className="meta">
                <b>{c.name || c.email}</b>
                <span>{c.regDate?.substring(0, 16).replace("T", " ")}</span>
                {isLogin && c.email === email && (
                  <Button size="sm" variant="ghost" onClick={() => onCommentDelete(c.commentId)}>삭제</Button>
                )}
              </div>
              <p>{c.content}</p>
            </li>
          ))}
        </CommentList>
      </Comments>
    </Wrap>
  );
};

export default BoardDetail;
