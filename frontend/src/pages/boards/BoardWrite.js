import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import AxiosApi from "../../api/AxiosApi";
import { errorMessage } from "../../api/AxiosInstance";
import Button from "../../components/common/Button";
import Input, { TextArea } from "../../components/common/Input";
import { useAuth } from "../../context/AuthContext";

// 글쓰기와 수정을 한 화면으로 (/board/write, /board/:boardId/edit)
const Wrap = styled.form`
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  h1 { margin: 0; font-size: ${({ theme }) => theme.size.xxl}; letter-spacing: -0.03em; }
  p.help { margin: 0 0 8px; color: ${({ theme }) => theme.color.sub}; font-size: ${({ theme }) => theme.size.sm}; }
  textarea { min-height: 340px; }
`;

const Count = styled.span`
  align-self: flex-end;
  font-size: ${({ theme }) => theme.size.xs};
  color: ${({ theme }) => theme.color.muted};
`;

const Row = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const BoardWrite = () => {
  const { boardId } = useParams();
  const editing = Boolean(boardId);
  const nav = useNavigate();
  const { email } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    AxiosApi.boardDetail(boardId)
      .then(({ data }) => {
        if (data.email !== email) {
          alert("작성자만 수정할 수 있습니다.");
          nav(`/board/${boardId}`, { replace: true });
          return;
        }
        setTitle(data.title);
        setContent(data.content);
      })
      .catch((err) => {
        alert(errorMessage(err));
        nav("/", { replace: true });
      });
  }, [editing, boardId, email, nav]);

  const isValid = title.trim() !== "" && content.trim() !== "" && title.length <= 100;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    try {
      if (editing) {
        await AxiosApi.boardModify(boardId, title, content);
        nav(`/board/${boardId}`, { replace: true });
      } else {
        const { data: newId } = await AxiosApi.boardWrite(title, content);
        nav(`/board/${newId}`, { replace: true }); // 뒤로가기로 작성 화면에 다시 오지 않도록
      }
    } catch (err) {
      alert(errorMessage(err, "저장하지 못했습니다."));
      setSaving(false);
    }
  };

  return (
    <Wrap onSubmit={onSubmit}>
      <h1>{editing ? "글 수정" : "글쓰기"}</h1>
      <p className="help">
        저장하면 AI 도우미가 이 글을 자동으로 색인합니다. {editing && "수정한 내용은 다시 색인되어 바로 답변에 반영됩니다."}
      </p>
      <Input value={title} maxLength={100} placeholder="제목" aria-label="제목" onChange={(e) => setTitle(e.target.value)} />
      <TextArea value={content} placeholder="내용을 입력하세요. 날짜·장소·방법처럼 구체적으로 쓸수록 AI가 정확히 답합니다."
                aria-label="내용" onChange={(e) => setContent(e.target.value)} />
      <Count>{content.length.toLocaleString()}자</Count>
      <Row>
        <Button variant="secondary" onClick={() => nav(-1)}>취소</Button>
        <Button type="submit" enabled={isValid && !saving}>{saving ? "저장 중…" : editing ? "수정 저장" : "등록"}</Button>
      </Row>
    </Wrap>
  );
};

export default BoardWrite;
