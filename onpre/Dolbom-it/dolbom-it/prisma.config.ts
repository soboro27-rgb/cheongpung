import { defineConfig } from "prisma/config";

// Render 환경: process.env.DATABASE_URL 직접 사용 (dotenv 불필요)
// 로컬 환경: .env 파일에서 로드 (next dev가 자동 처리)
const url = process.env.DATABASE_URL ?? ""

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
