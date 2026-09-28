import { useEffect, useMemo, useState } from "react";
import { fetchContacts, FetchContactsPermissionError } from "@apps-in-toss/web-framework";
import { Search } from "../components/icons";
import { go } from "../useHashRoute";

export interface Person {
  name: string;
  phone: string;
}

export const MAX_RECIPIENTS = 20;

// 휴대폰 번호(01x)만 문자를 받을 수 있다. 서버도 같은 규칙으로 다시 거른다.
function toMobile(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  const n = d.startsWith("82") ? "0" + d.slice(2) : d;
  return /^01[016789]\d{7,8}$/.test(n) ? n : null;
}

function maskPhone(p: string): string {
  return `${p.slice(0, 3)}-****-${p.slice(-4)}`;
}

async function loadAll(): Promise<Person[]> {
  const seen = new Set<string>();
  const out: Person[] = [];
  let offset = 0;
  for (;;) {
    const res = await fetchContacts({ size: 200, offset });
    for (const c of res.result) {
      const phone = c.phoneNumber ? toMobile(c.phoneNumber) : null;
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      out.push({ name: c.name || "이름없음", phone });
    }
    if (res.done || res.nextOffset == null) break;
    offset = res.nextOffset;
  }
  return out;
}

export default function Pick({
  selected,
  setSelected,
}: {
  selected: Map<string, Person>;
  setSelected: (m: Map<string, Person>) => void;
}) {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setErr("");
    setDenied(false);
    try {
      setPeople(await loadAll());
    } catch (e) {
      if (e instanceof FetchContactsPermissionError) setDenied(true);
      else setErr("연락처를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function askPermission() {
    const p = await fetchContacts.openPermissionDialog();
    if (p === "allowed") await load();
  }

  const shown = useMemo(
    () => (people ?? []).filter((p) => !q.trim() || p.name.includes(q.trim())),
    [people, q],
  );

  function toggle(p: Person) {
    const next = new Map(selected);
    if (next.has(p.phone)) next.delete(p.phone);
    else if (next.size >= MAX_RECIPIENTS) {
      setErr(`한 번에 ${MAX_RECIPIENTS}명까지 고를 수 있어요.`);
      return;
    } else next.set(p.phone, p);
    setErr("");
    setSelected(next);
  }

  if (denied) {
    return (
      <div className="screen">
        <h1 className="title">연락처 접근이 필요해요</h1>
        <p className="lead">확인을 보낼 분을 고르려면 연락처를 읽을 수 있어야 해요. 고르지 않은 연락처는 서버로 보내지 않아요.</p>
        <div className="cta-bar">
          <div className="cta-inner">
            <button className="btn btn-primary" onClick={askPermission}>
              연락처 접근 허용하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 className="title">누구에게 물어볼까요?</h1>
      <p className="lead">최대 {MAX_RECIPIENTS}명까지 고를 수 있어요.</p>

      <label className="search">
        <Search size={20} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름으로 찾기"
          aria-label="이름으로 찾기"
        />
      </label>
      {err && <p className="error">{err}</p>}
      {!people && !err && <p className="note">연락처를 불러오는 중이에요...</p>}
      {people && shown.length === 0 && <p className="note">문자를 보낼 수 있는 연락처가 없어요.</p>}

      {shown.map((p) => (
        <label key={p.phone} className="contact-row">
          <input type="checkbox" checked={selected.has(p.phone)} onChange={() => toggle(p)} />
          <span>
            <span className="contact-name">{p.name}</span>
            <br />
            <span className="contact-phone">{maskPhone(p.phone)}</span>
          </span>
        </label>
      ))}

      <div className="cta-bar">
        <div className="cta-inner">
          <button className="btn btn-primary" disabled={selected.size === 0} onClick={() => go("/compose")}>
            {selected.size === 0 ? "연락처를 골라 주세요" : `${selected.size}명 선택 완료`}
          </button>
        </div>
      </div>
    </div>
  );
}
