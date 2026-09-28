import { useEffect, useState } from "react";
import { api, type BatchSummary } from "../api";
import { go } from "../useHashRoute";

export default function Home() {
  const [batches, setBatches] = useState<BatchSummary[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.listBatches().then(setBatches).catch((e: Error) => setErr(e.message));
  }, []);

  return (
    <div className="screen">
      <h1 className="title">이게누구야</h1>
      <p className="lead">
        저장해 둔 연락처 중 계속 인연을 이어가고 싶은지, 내가 대신 물어봐 드려요. 삭제는 항상 내가 마지막에
        직접 정해요.
      </p>

      <details className="intro">
        <summary>이게누구야를 시작한 이유</summary>
        <p>
          우리는 인연을 전화번호로 저장해왔지만, 저장만 해왔을 뿐 지우지는 않았어요. 그러다 보니 정작
          소중한 인연을 놓치고 있진 않은지, 정리하고 싶었지만 차마 못 해서 쌓여만 가는 번호는 없는지
          돌아볼 틈이 없었죠. 언제 저장했는지 기억도 안 나는 번호도 있고요. 이게누구야는 그런 연락처를
          하나씩 정리하면서, 정리한 만큼 새로운 인연이 들어올 자리를 만들어드리려고 시작됐어요.
        </p>
        <ul className="fact-list">
          <li>성인 10명 중 9명이 "인맥 다이어트가 필요하다"고 답했어요.</li>
          <li>정리한 사람 중 후회한다는 답변은 2.1%뿐이었어요.</li>
          <li>"관계는 숫자가 아니라 깊이가 중요하다" — 한 심리학 교수의 말이에요.</li>
        </ul>
      </details>

      <h2 className="section-title">지난 확인 요청</h2>
      {err && <p className="error">{err}</p>}
      {batches && batches.length === 0 && <p className="note">아직 보낸 요청이 없어요.</p>}
      {batches?.map((b) => (
        <button key={b.id} className="card" onClick={() => go(`/batch/${b.id}`)}>
          <p className="card-date">{new Date(b.createdAt).toLocaleString("ko-KR")}</p>
          <div className="stats">
            <span>총 {b.total}명</span>
            <span className="stat-keep">유지 {b.keep}</span>
            <span className="stat-release">정리 동의 {b.release}</span>
            <span className="stat-pending">응답 대기 {b.pending}</span>
          </div>
        </button>
      ))}

      <div className="cta-bar">
        <div className="cta-inner">
          <button className="btn btn-primary" onClick={() => go("/pick")}>
            확인할 연락처 고르기
          </button>
        </div>
      </div>
    </div>
  );
}
