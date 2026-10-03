import { useEffect, useState } from "react";
import { Share } from "@apps-in-toss/web-framework";
import { api, type Account, type BatchSummary } from "../api";
import { go } from "../useHashRoute";

const APP_ICON_URL = "https://static.toss.im/appsintoss/91443/mcp-images/342385b6-5c21-4f66-a467-a9de815e78cb/0.png";

export default function Home() {
  const [batches, setBatches] = useState<BatchSummary[] | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [err, setErr] = useState("");
  const [sharing, setSharing] = useState(false);

  async function shareApp() {
    setSharing(true);
    try {
      const link = await Share.createLink({ path: "intoss://igenuguya-miniapp", ogImageUrl: APP_ICON_URL });
      await Share.sendMessage({ message: `오래된 연락처 정리, 이게누구야가 대신 물어봐드려요.\n${link}` });
    } catch {
      // 공유 시트를 닫거나 지원하지 않는 환경이면 조용히 무시한다.
    } finally {
      setSharing(false);
    }
  }

  useEffect(() => {
    api
      .listBatches()
      .then((r) => {
        setBatches(r.batches);
        setAccount(r.account ?? null);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  return (
    <div className="screen">
      <div className="title-row">
        <h1 className="title">이게누구야</h1>
        <button className="share-link" onClick={shareApp} disabled={sharing}>
          {sharing ? "링크 만드는 중..." : "공유하기"}
        </button>
      </div>
      <p className="lead">
        직접 물어보기도, 그냥 두기도 애매한 연락처 있으시죠. 제가 대신 물어보고 확인해 드려요. 삭제는
        언제나 요청하신 분이 직접 정해요.
      </p>

      <details className="intro">
        <summary>이게누구야를 시작한 이유</summary>
        <p>
          우리는 누군가와의 관계를 전화번호로 저장하면서 시작해요. 그런데 저장만 해왔을 뿐, 불필요한
          관계를 지워야겠다는 생각은 해보지 못했어요. 그러다 보니 정작 소중한 관계를 놓치고 있진 않은지,
          정리하고 싶었지만 차마 못 하고 쌓여왔죠. 언제 저장했는지 기억도 안 나는 번호도 있고요.
          이게누구야는 그런 연락처를 하나씩 정리하면서, 정리한 만큼 새로운 관계 혹은 인연이 들어올 자리를
          만들어드리려고 시작했어요.
        </p>
        <ul className="fact-list">
          <li>성인 90%, 인맥 다이어트 필요해요</li>
          <li>정리 후 후회율은 2.1%뿐이었어요</li>
          <li>"관계는 깊이가 중요해요" — 심리학자</li>
        </ul>
      </details>

      {account && (
        <p className="note">
          오늘 무료 {account.freeRemaining}/{account.freeDailyLimit}건 남음 · 보유 발송권 {account.credits}건
        </p>
      )}

      <div className="title-row" style={{ marginTop: "var(--space-5)" }}>
        <h2 className="section-title" style={{ margin: 0 }}>지난 확인 요청</h2>
        {batches && batches.length > 0 && (
          <button className="share-link" onClick={() => go("/dashboard")}>
            전체 현황 보기
          </button>
        )}
      </div>
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
