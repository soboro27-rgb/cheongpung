import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getKakaoFriends } from "@/lib/kakao";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });

  try {
    const friends = await getKakaoFriends(user.accessToken ?? "");
    return NextResponse.json({ friends });
  } catch (e) {
    console.error("[friends]", e);
    return NextResponse.json(
      { error: "카카오 친구목록 조회에 실패했습니다. talk_message/friends 권한 심사 상태를 확인해 주세요." },
      { status: 502 },
    );
  }
}
