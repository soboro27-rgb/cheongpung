import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";
import { isMockMode } from "@/lib/kakao";

// 카카오 앱 심사 전 화면/플로우 확인용 목업 로그인.
// MOCK_KAKAO=true 일 때만 동작하고, 그 외에는 항상 404.
export async function GET(req: NextRequest) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;

  const user = await prisma.user.upsert({
    where: { kakaoId: "dev-mock-user" },
    update: {},
    create: {
      kakaoId: "dev-mock-user",
      nickname: "테스트유저",
      accessToken: "mock-access-token",
    },
  });

  const session = await createSession({ userId: user.id });
  await setSessionCookie(session);

  return NextResponse.redirect(`${base}/dashboard`);
}
