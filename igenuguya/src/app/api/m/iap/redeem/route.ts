import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUserId, json, preflight } from "@/lib/mobile";

export const OPTIONS = preflight;

// productId -> 지급할 발송권 수. 콘솔에 등록된 IAP 상품과 1:1로 맞춘다.
const PRODUCTS: Record<string, number> = {
  "ait.0000078387.6c3bc475.f0886f6c5d.0573601637": 10, // 발송권 10건, 1,000원
};

// 주의: 아직 앱인토스 서버 영수증 검증(mTLS)을 연동하지 않았다. MOCK_IAP=true가
// 아니면 항상 501을 반환해, 검증 없이 크레딧이 지급되는 걸 막는다.
export async function POST(req: NextRequest) {
  const userId = await getMobileUserId(req);
  if (!userId) return json(req, { error: "로그인이 필요합니다." }, 401);

  if (process.env.MOCK_IAP !== "true") {
    return json(req, { error: "결제 충전은 아직 준비 중이에요." }, 501);
  }

  const { productId } = (await req.json().catch(() => ({}))) as { productId?: string };
  const credits = productId ? PRODUCTS[productId] : undefined;
  if (!credits) return json(req, { error: "알 수 없는 상품이에요." }, 400);

  await prisma.purchase.create({ data: { userId, productId: productId!, credits, verified: false } });
  const user = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: credits } },
  });

  return json(req, { credits: user.credits });
}
