import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";
import { exchangeCodeForToken, getKakaoProfile } from "@/lib/kakao";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;

  if (error || !code) {
    return NextResponse.redirect(`${base}/?error=kakao_login_failed`);
  }

  try {
    const token = await exchangeCodeForToken(code);
    const profile = await getKakaoProfile(token.access_token);
    const tokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);

    const user = await prisma.user.upsert({
      where: { kakaoId: profile.kakaoId },
      update: {
        nickname: profile.nickname,
        thumbnailUrl: profile.thumbnailUrl,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenExpiresAt,
      },
      create: {
        kakaoId: profile.kakaoId,
        nickname: profile.nickname,
        thumbnailUrl: profile.thumbnailUrl,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenExpiresAt,
      },
    });

    const session = await createSession({ userId: user.id });
    await setSessionCookie(session);

    return NextResponse.redirect(`${base}/dashboard`);
  } catch (e) {
    console.error("[kakao callback]", e);
    return NextResponse.redirect(`${base}/?error=kakao_login_failed`);
  }
}
