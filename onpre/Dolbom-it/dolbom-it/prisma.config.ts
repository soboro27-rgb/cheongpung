import { defineConfig } from "prisma/config";

function buildMigrationUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    console.error("[prisma.config] DATABASE_URL이 비어 있음");
    return "";
  }

  try {
    const u = new URL(trimmed);
    console.log(`[prisma.config] URL 파싱 성공: host=${u.host} pathname=${u.pathname} user=${u.username}`);

    // Render PostgreSQL 외부 URL은 sslmode=require 필요
    if (u.host.includes("render.com") && !u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }

    return u.toString();
  } catch (e) {
    // URL 파싱 자체가 실패 → 구조적 문제
    console.error("[prisma.config] URL 파싱 실패:", String(e));
    console.log("[prisma.config] 길이:", trimmed.length);
    console.log("[prisma.config] 앞 40자:", trimmed.slice(0, 40));
    console.log("[prisma.config] @ 포함 여부:", trimmed.includes("@"));
    return trimmed;
  }
}

const url = buildMigrationUrl(process.env.DATABASE_URL ?? "");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
