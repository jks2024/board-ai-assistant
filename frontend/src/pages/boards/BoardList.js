import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import AxiosApi from "../../api/AxiosApi";
import { errorMessage } from "../../api/AxiosInstance";
import BoardItem from "../../components/board/BoardItem";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Pagination from "../../components/common/Pagination";
import AskBar from "../../components/rag/AskBar";
import { useAuth } from "../../context/AuthContext";

/* 메인 화면 = 게시글 목록
   위: 게시판에 바로 질문 (이 서비스의 핵심 동작)  /  아래: 키워드 검색 · 글쓰기 · 목록 · 페이지 */
const Hero = styled.section`
  margin-bottom: 28px;
  h1 {
    margin: 0 0 6px;
    font-size: ${({ theme }) => theme.size.hero};
    line-height: 1.25;
    letter-spacing: -0.035em;
    color: ${({ theme }) => theme.color.ink};
  }
  p {
    margin: 0 0 18px;
    color: ${({ theme }) => theme.color.sub};
    max-width: 60ch;
  }
  @media (max-width: 640px) { h1 { font-size: ${({ theme }) => theme.size.xxl}; } }
`;

const Examples = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  button {
    padding: 5px 12px;
    border-radius: ${({ theme }) => theme.radius.pill};
    border: 1px solid ${({ theme }) => theme.color.line};
    background: ${({ theme }) => theme.color.sheet};
    color: ${({ theme }) => theme.color.sub};
    font-size: ${({ theme }) => theme.size.sm};
    cursor: pointer;
  }
  button:hover { border-color: ${({ theme }) => theme.color.ink}; color: ${({ theme }) => theme.color.ink}; }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  h2 { margin: 0 auto 0 0; font-size: ${({ theme }) => theme.size.xl}; letter-spacing: -0.02em; }
  h2 small { margin-left: 8px; font-size: ${({ theme }) => theme.size.sm}; color: ${({ theme }) => theme.color.muted}; font-weight: 500; }
  @media (max-width: 640px) { flex-wrap: wrap; h2 { width: 100%; } }
`;

const SearchForm = styled.form`
  display: flex;
  gap: 6px;
  width: 280px;
  input { padding: 8px 12px; }
  @media (max-width: 640px) { flex: 1; width: auto; }
`;

const Sheet = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  background: ${({ theme }) => theme.color.sheet};
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.sheet};
  overflow: hidden;
`;

const Empty = styled.div`
  padding: 56px 20px;
  text-align: center;
  color: ${({ theme }) => theme.color.sub};
  background: ${({ theme }) => theme.color.sheet};
  border: 1px dashed ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.sheet};
  p { margin: 0 0 14px; }
`;

const Notice = styled.p`
  margin: 10px 0 0;
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.sub};
`;

const EXAMPLES = ["스터디 모임은 언제 하나요?", "과제 제출 마감이 언제야?", "LazyInitializationException 어떻게 고쳐요?"];

const BoardList = () => {
  const nav = useNavigate();
  const { isLogin, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 0);
  const keyword = params.get("q") || "";
  const [input, setInput] = useState(keyword);
  const [data, setData] = useState(null); // PageResDto
  const [notice, setNotice] = useState("");

  const fetchPage = useCallback(async () => {
    try {
      const res = keyword ? await AxiosApi.boardSearch(keyword, page) : await AxiosApi.boardPage(page);
      setData(res.data);
    } catch (err) {
      setData({ content: [], totalPages: 0, totalElements: 0 });
      setNotice(errorMessage(err, "게시글 목록을 불러오지 못했습니다."));
    }
  }, [keyword, page]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // "색인 중" 글이 있으면 잠시 뒤 상태를 다시 확인 (색인이 끝나면 "검색 가능"으로 바뀜)
  useEffect(() => {
    if (!data?.content?.some((b) => b.indexStatus === "INDEXING")) return;
    const timer = setTimeout(fetchPage, 2500);
    return () => clearTimeout(timer);
  }, [data, fetchPage]);

  const ask = (q) => nav(`/ai?q=${encodeURIComponent(q)}`);

  const onSearch = (e) => {
    e.preventDefault();
    const q = input.trim();
    setParams(q ? { q } : {});
  };

  const reindexAll = async () => {
    if (!window.confirm("모든 글을 다시 색인할까요? 글이 많으면 시간이 걸립니다.")) return;
    setNotice("전체 재색인 중…");
    try {
      const { data: r } = await AxiosApi.adminReindexAll();
      setNotice(`전체 재색인 완료: ${r.total}건 중 ${r.ready}건 검색 가능, ${r.failed}건 실패`);
      fetchPage();
    } catch (err) {
      setNotice(errorMessage(err, "전체 재색인에 실패했습니다."));
    }
  };

  return (
    <>
      <Hero>
        <h1>우리 게시판에 물어보세요</h1>
        <p>AI 도우미가 게시판에 올라온 글만 근거로 답하고, 근거가 된 글 번호를 함께 붙입니다.</p>
        <AskBar onAsk={ask} />
        <Examples>
          {EXAMPLES.map((q) => (
            <button key={q} type="button" onClick={() => ask(q)}>{q}</button>
          ))}
        </Examples>
      </Hero>

      <Toolbar>
        <h2>
          게시판 {keyword && `· “${keyword}” 검색 결과`}
          {data && <small>{data.totalElements}개</small>}
        </h2>
        <SearchForm onSubmit={onSearch} role="search">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="제목·내용 검색" aria-label="키워드 검색" />
          <Button type="submit" variant="secondary" size="sm">검색</Button>
        </SearchForm>
        {isAdmin && <Button variant="secondary" size="sm" onClick={reindexAll}>전체 재색인</Button>}
        <Button size="sm" onClick={() => nav(isLogin ? "/board/write" : "/login")}>글쓰기</Button>
      </Toolbar>

      {data === null ? (
        <Empty>불러오는 중…</Empty>
      ) : data.content.length === 0 ? (
        <Empty>
          <p>{keyword ? "검색 결과가 없습니다. 다른 낱말로 찾아보세요." : "아직 글이 없습니다. 첫 글을 쓰면 AI 도우미가 바로 배웁니다."}</p>
          {!keyword && <Button onClick={() => nav(isLogin ? "/board/write" : "/login")}>첫 글 쓰기</Button>}
        </Empty>
      ) : (
        <Sheet>
          {data.content.map((board) => (
            <BoardItem key={board.boardId} board={board} onClick={(id) => nav(`/board/${id}`)} />
          ))}
        </Sheet>
      )}
      {notice && <Notice role="status">{notice}</Notice>}
      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          onChange={(p) => setParams(keyword ? { q: keyword, page: p } : { page: p })}
        />
      )}
    </>
  );
};

export default BoardList;
