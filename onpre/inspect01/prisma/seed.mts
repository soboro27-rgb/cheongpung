import "dotenv/config";
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminHash = bcrypt.hashSync('admin1234', 10)
  const inspHash = bcrypt.hashSync('insp1234', 10)

  await prisma.user.upsert({
    where: { loginId: 'admin' },
    update: {},
    create: { loginId: 'admin', passwordHash: adminHash, name: '주부장(관리자)', role: 'ADMIN' },
  })

  for (let i = 1; i <= 5; i++) {
    await prisma.user.upsert({
      where: { loginId: `insp0${i}` },
      update: {},
      create: { loginId: `insp0${i}`, passwordHash: inspHash, name: `검수자${i}`, role: 'INSPECTOR' },
    })
  }
  console.log('Seed complete — admin/admin1234, insp01~05/insp1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())
