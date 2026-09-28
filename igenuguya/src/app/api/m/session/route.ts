import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, preflight, signMobileToken } from "@/lib/mobile";

export const OPTIONS = preflight;

// 미니앱이 getAnonymousKey()로 받은 hash를 넘기면 사용자를 만들고 토큰을 준다.
// 주의: hash는 서버 검증 없이 신뢰한다. 출시 전 앱인토스 '식별키 검증하기' API(mTLS)로 확인할 것.
export async function POST(req: NextRequest) {
  const { anonKey } = (await req.json().catch(() => ({}))) as { anonKey?: string };
  if (!anonKey || anonKey.length < 8 || anonKey.length > 200) {
    return json(req, { error: "잘못된 요청입니다." }, 400);
  }
  const user = await prisma.user.upsert({
    where: { anonKey },
    update: {},
    create: { anonKey, nickname: "회원" },
  });
  return json(req, { token: await signMobileToken(user.id) });
}
