import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
function createPrisma() {
  const adapter = new PrismaLibSql({ url: 'file:dev.db' })
  return new PrismaClient({ adapter })
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || createPrisma()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
