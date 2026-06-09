import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

function createPrismaClient() {
  const connectionString = (process.env.DATABASE_URL ?? "").replace(/\s+/g, "")
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
  const pool = new pg.Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter }) as PrismaClient
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
