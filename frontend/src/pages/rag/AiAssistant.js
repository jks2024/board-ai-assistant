import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import AxiosApi from "../../api/AxiosApi";
import { errorMessage } from "../../api/AxiosInstance";
import AskBar from "../../components/rag/AskBar";
import AnswerView from "../../components/rag/AnswerView";
import { NODE } from "../../components/rag/TraceView";

/* AI 도우미 (/ai) - 질문·답변은 왼쪽, 읽는 법은 오른쪽 */
const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 28px;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Title = styled.h1`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.size.xxl};
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.color.ink};
`;

const Lead = styled.p`
  margin: 0 0 18px;
  color: ${({ theme }) => theme.color.sub};
`;

const Scope = styled.select`
  border: none;
  border-left: 1px solid ${({ theme }) => theme.color.line};
  padding: 0 10px;
  background: transparent;
  font-weight: 600;
  color: ${({ theme }) => theme.color.ink};
  cursor: pointer;
`;

const Thread = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
`;

const Pending = styled.div`
  padding: 18px 20px;
  border-radius: ${({ theme }) => theme.radius.sheet};
  border: 1px dashed ${({ theme }) => theme.color.line};
  color: ${({ theme }) => theme.color.sub};
  background: ${({ theme }) => theme.color.sheet};
`;

const ErrorBox = styled.div`
  padding: 14px 18px;
  border-radius: ${({ theme }) => theme.radius.sheet};
  background: #fdf1f1;
  color: ${({ theme }) => theme.color.failed};
  font-weight: 600;
`;

const Guide = styled.aside`
  position: sticky;
  top: 84px;
  padding: 18px;
  border-radius: ${({ theme }) => theme.radius.sheet};
  background: ${({ theme }) => theme.color.sheet};
  border: 1px solid ${({ theme }) => theme.color.line};
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.sub};
  h2 { margin: 0 0 10px; font-size: ${({ theme }) => theme.size.md}; color: ${({ theme }) => theme.color.text}; }
  ul { margin: 0 0 16px; padding: 0; list-style: none; display: grid; gap: 8px; }
  li { display: flex; gap: 8px; align-items: baseline; }
  mark { background: linear-gradient(transparent 35%, ${({ theme }) => theme.color.highlight} 35%); color: ${({ theme }) => theme.color.ink}; font-weight: 800; padding: 0 3px; }
  i { flex: none; width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; }
`;

const AiAssistant = () => {
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState("all");
  const [items, setItems] = useState([]); // 최신 답변이 위
  const [loading, setLoading] = useState(null); // 질문 중인 문장
  const [error, setError] = useState("");
  const asked = useRef(false);

  const ask = useCallback(
    async (question) => {
      setError("");
      setLoading(question);
      try {
        const { data } = await AxiosApi.ragChat(question, scope);
        setItems((prev) => [{ question, ...data }, ...prev]);
      } catch (err) {
        // 502: AI 서비스(FastAPI) 장애 - 게시판은 정상
        setError(errorMessage(err, "답변을 받지 못했습니다."));
      } finally {
        setLoading(null);
      }
    },
    [scope],
  );

  // 메인에서 /ai?q=... 로 넘어오면 바로 질문 (StrictMode 이중 실행 방지)
  useEffect(() => {
    const q = params.get("q");
    if (q && !asked.current) {
      asked.current = true;
      ask(q);
      setParams({}, { replace: true });
    }
  }, [params, ask, setParams]);

  return (
    <Grid>
      <section>
        <Title>AI 도우미</Title>
        <Lead>게시판 글만 근거로 답합니다. 근거가 없으면 지어내지 않고 “찾지 못했습니다”라고 말합니다.</Lead>
        <AskBar
          onAsk={ask}
          loading={Boolean(loading)}
          extra={
            <Scope value={scope} onChange={(e) => setScope(e.target.value)} aria-label="검색 범위">
              <option value="all">전체 글</option>
              <option value="mine">내 글만</option>
            </Scope>
          }
        />
        <Thread aria-live="polite">
          {loading && <Pending>“{loading}” 관련 글을 찾고 있습니다…</Pending>}
          {error && <ErrorBox role="alert">{error}</ErrorBox>}
          {items.map((item, i) => (
            <AnswerView key={items.length - i} item={item} />
          ))}
        </Thread>
      </section>

      <Guide>
        <h2>답변 읽는 법</h2>
        <ul>
          <li><mark>#3</mark><span>근거가 된 게시글 번호. 누르면 원문이 열립니다.</span></li>
          <li><span>유사도가 낮은데 답했다면 기준값(MIN_SCORE)을 의심해 보세요.</span></li>
        </ul>
        <h2>실행 경로 색</h2>
        <ul>
          {["generate", "rewrite", "abstain"].map((k) => (
            <li key={k}><i style={{ background: NODE[k].color }} /><span>{NODE[k].label}</span></li>
          ))}
        </ul>
        <h2>검색 범위</h2>
        <ul>
          <li><span>“내 글만”은 로그인한 계정의 글 중 검색 가능한 글만 찾습니다.</span></li>
        </ul>
      </Guide>
    </Grid>
  );
};

export default AiAssistant;
