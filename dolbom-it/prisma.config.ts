import { defineConfig } from "prisma/config";

function fixDbUrl(raw: string): string {
  const s = raw.replace(/\s+/g, "").trim();
  if (!s) return s;

  const schemeMatch = s.match(/^(postgresql?:\/\/)/);
  if (!schemeMatch) return s;

  const scheme = schemeMatch[1];
  const rest = s.slice(scheme.length);

  // lastIndexOf 로 @ 찾기 — 비밀번호 안에 @ 있어도 올바르게 분리
  const lastAt = rest.lastIndexOf("@");
  if (lastAt === -1) return s;

  const userinfo = rest.slice(0, lastAt);
  const hostAndDb = rest.slice(lastAt + 1);

  const colonIdx = userinfo.indexOf(":");
  if (colonIdx === -1) return s;

  const user = userinfo.slice(0, colonIdx);
  const password = userinfo.slice(colonIdx + 1);

  // decode 없이 바로 encode — % 같은 미인코딩 특수문자 처리
  const encodedPassword = encodeURIComponent(password);

  const result = `${scheme}${encodeURIComponent(user)}:${encodedPassword}@${hostAndDb}`;
  console.log(`[prisma.config] 수정된 URL: ${scheme}[user]:[encoded]@${hostAndDb}`);
  return result;
}

const url = fixDbUrl(process.env.DATABASE_URL ?? "");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
