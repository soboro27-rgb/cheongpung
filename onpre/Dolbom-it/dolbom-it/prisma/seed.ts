// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config()

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
})
const adapter = new PrismaPg(pool)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as PrismaClient

async function main() {
  const parent = await prisma.user.upsert({
    where: { email: "parent@test.com" },
    update: {},
    create: {
      email: "parent@test.com",
      name: "김부모",
      role: "PARENT",
      lat: 37.5665,
      lng: 126.978,
      passBalance: 50,
    },
  })

  const caregivers = [
    {
      email: "care1@test.com",
      name: "이돌봄",
      lat: 37.568,
      lng: 126.98,
      bio: "5년 경력의 보육사입니다. 영유아 전문으로 활동하고 있어요.",
      grade: "MASTER",
      certifications: [
        { type: "보육교사 1급", issuer: "보건복지부", verified: true },
        { type: "아이돌보미", issuer: "여성가족부", verified: true },
      ],
    },
    {
      email: "care2@test.com",
      name: "박케어",
      lat: 37.564,
      lng: 126.976,
      bio: "초등 저학년 전문 케어메이트입니다. 학습 지도도 가능합니다.",
      grade: "PRO",
      certifications: [{ type: "보육교사 2급", issuer: "보건복지부", verified: true }],
    },
    {
      email: "care3@test.com",
      name: "최돌봄",
      lat: 37.57,
      lng: 126.982,
      bio: "처음 시작하는 새내기 케어메이트입니다. 성실하게 돌봐드릴게요!",
      grade: "BASIC",
      certifications: [],
    },
  ]

  for (const cg of caregivers) {
    const user = await prisma.user.upsert({
      where: { email: cg.email },
      update: {},
      create: {
        email: cg.email,
        name: cg.name,
        role: "CAREGIVER",
        lat: cg.lat,
        lng: cg.lng,
        passBalance: 0,
      },
    })

    const profile = await prisma.careProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: cg.bio,
        grade: cg.grade,
        passPerHour: cg.grade === "MASTER" ? 15 : cg.grade === "PRO" ? 10 : 5,
        reviewScore: cg.grade === "MASTER" ? 4.8 : cg.grade === "PRO" ? 4.2 : 0,
        reviewCount: cg.grade === "MASTER" ? 23 : cg.grade === "PRO" ? 8 : 0,
        adminVerified: cg.grade !== "BASIC",
      },
    })

    for (const cert of cg.certifications) {
      await prisma.certification.create({ data: { ...cert, careProfileId: profile.id } })
    }
  }

  console.log("✅ 시드 완료:", { parentId: parent.id })
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
