import { defineConfig } from "prisma/config";

const raw = process.env.DATABASE_URL ?? "";

// Debug: URL 구조 확인 (비밀번호 제외)
try {
  const parsed = new URL(raw);
  console.log("[prisma.config] protocol:", parsed.protocol);
  console.log("[prisma.config] host:", parsed.host);
  console.log("[prisma.config] pathname:", parsed.pathname);
  console.log("[prisma.config] username:", parsed.username);
  console.log("[prisma.config] hasPassword:", !!parsed.password);
} catch (e) {
  console.error("[prisma.config] URL parse FAILED:", e);
  console.log("[prisma.config] raw length:", raw.length);
  console.log("[prisma.config] raw preview:", raw.slice(0, 20) + "...");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: raw,
  },
});
