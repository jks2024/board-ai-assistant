import styled from "styled-components";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell, { AuthCard, BottomText } from "../components/layout/AuthShell";
import { errorMessage } from "../api/AxiosInstance";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import AxiosApi from "../api/AxiosApi";

/* ───────── 정규식 ───────── */
// 이메일: 공백·@ 없는 문자 + @ + 도메인 + . + 2자 이상 최상위 도메인
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// 비밀번호: 8~20자, 영문 + 숫자 + 특수문자(!@#$%^&*) 각 1개 이상
const PWD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
// 이름: 한글 또는 영문 2~10자
const NAME_REGEX = /^[가-힣a-zA-Z]{2,10}$/;

/* ───────── 스타일 ───────── */
// 입력창 + 메시지를 한 묶음으로
const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

// 입력창 아래 메시지. 높이를 고정해 메시지가 생겨도 레이아웃이 흔들리지 않음
const Message = styled.p`
  margin: 4px 4px 0;
  min-height: 18px;
  font-size: 12px;
  color: ${({ $valid }) => ($valid ? "#1E8A5A" : "#D14343")};
`;

const Signup = () => {
  const [inputEmail, setInputEmail] = useState("");
  const [inputPwd, setInputPwd] = useState("");
  const [inputPwdCheck, setInputPwdCheck] = useState("");
  const [inputName, setInputName] = useState("");
  const [emailStatus, setEmailStatus] = useState("idle");

  const nav = useNavigate();

  /* 유효성은 state로 따로 두지 않고 렌더링 때 계산(파생값)
     → 비밀번호를 바꾸면 재확인 결과도 자동으로 다시 계산됨 */
  const isEmail = EMAIL_REGEX.test(inputEmail);
  const isPwd = PWD_REGEX.test(inputPwd);
  const isPwdCheck = inputPwdCheck !== "" && inputPwd === inputPwdCheck;
  const isName = NAME_REGEX.test(inputName);

  /* 정규식 통과 후에만 서버에 중복 확인 요청
     - 0.5초 디바운스: 입력이 멈췄을 때만 요청
     - ignore 플래그: 늦게 도착한 이전 응답이 최신 결과를 덮어쓰지 않게 함 */
  useEffect(() => {
    if (!isEmail) {
      setEmailStatus("idle");
      return;
    }

    setEmailStatus("checking");
    let ignore = false;

    const timer = setTimeout(async () => {
      try {
        const res = await AxiosApi.memberExist(inputEmail);
        if (ignore) return;
        // 서버는 이미 가입된 이메일이면 true 를 반환 (GET /auth/exists/{email})
        setEmailStatus(res.data === true ? "duplicate" : "available");
      } catch (err) {
        if (!ignore) setEmailStatus("error");
      }
    }, 500);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [inputEmail, isEmail]);

  // 형식 OK + 중복 아님 이어야 최종 통과
  const isEmailOk = isEmail && emailStatus === "available";
  const isAllValid = isEmailOk && isPwd && isPwdCheck && isName;

  // 이메일 메시지 문구
  const getEmailMessage = () => {
    if (!inputEmail) return "";
    if (!isEmail) return "이메일 형식이 올바르지 않습니다.";
    switch (emailStatus) {
      case "checking":
        return "중복 확인 중...";
      case "available":
        return "사용 가능한 이메일입니다.";
      case "duplicate":
        return "이미 가입된 이메일입니다.";
      case "error":
        return "중복 확인 중 오류가 발생했습니다.";
      default:
        return "";
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isAllValid) return;

    try {
      const response = await AxiosApi.memberSignup(inputEmail, inputPwd, inputName);
      if (response.data === true) {
        alert(`${inputName}님, 회원가입이 완료되었습니다. 로그인해 주세요.`);
        nav("/login", { replace: true });
      } else {
        alert("회원 가입에 실패했습니다.");
      }
    } catch (err) {
      alert(errorMessage(err, "회원 가입에 실패했습니다."));
    }
  };

  return (
    <AuthShell>
      <AuthCard onSubmit={onSubmit}>
        <h2>회원가입</h2>
        <p className="sub">가입하면 글을 쓰고 AI 도우미에게 질문할 수 있습니다.</p>

        <Field>
          <Input
            type="email"
            value={inputEmail}
            placeholder="이메일" aria-label="이메일"
            onChange={(e) => setInputEmail(e.target.value.trim())}
          />
          <Message $valid={isEmailOk}>{getEmailMessage()}</Message>
        </Field>

        <Field>
          <Input
            type="password"
            value={inputPwd}
            placeholder="비밀번호" aria-label="비밀번호"
            onChange={(e) => setInputPwd(e.target.value)}
          />
          <Message $valid={isPwd}>
            {inputPwd &&
              (isPwd
                ? "사용 가능한 비밀번호입니다."
                : "영문, 숫자, 특수문자 포함 8~20자로 입력하세요.")}
          </Message>
        </Field>

        <Field>
          <Input
            type="password"
            value={inputPwdCheck}
            placeholder="비밀번호 확인" aria-label="비밀번호 확인"
            onChange={(e) => setInputPwdCheck(e.target.value)}
          />
          <Message $valid={isPwdCheck}>
            {inputPwdCheck &&
              (isPwdCheck
                ? "비밀번호가 일치합니다."
                : "비밀번호가 일치하지 않습니다.")}
          </Message>
        </Field>

        <Field>
          <Input
            value={inputName}
            placeholder="이름" aria-label="이름"
            onChange={(e) => setInputName(e.target.value.trim())}
          />
          <Message $valid={isName}>
            {inputName &&
              (isName
                ? "사용 가능한 이름입니다."
                : "한글 또는 영문 2~10자로 입력하세요.")}
          </Message>
        </Field>

        <Button type="submit" block enabled={isAllValid}>
          가입하기
        </Button>

        <BottomText>
          이미 계정이 있으신가요?
          <Link to="/login">로그인</Link>
        </BottomText>
      </AuthCard>
    </AuthShell>
  );
};

export default Signup;
