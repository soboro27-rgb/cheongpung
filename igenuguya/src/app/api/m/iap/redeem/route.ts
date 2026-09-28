import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUserId, json, preflight } from "@/lib/mobile";
import { getOrderStatus, isMtlsConfigured } from "@/lib/tossOrder";

export const OPTIONS = preflight;

// sku(productId) -> 지급할 발송권 수. 콘솔에 등록된 IAP 상품과 1:1로 맞춘다.
const PRODUCTS: Record<string, number> = {
  "ait.0000078387.6c3bc475.f0886f6c5d.0573601637": 10, // 발송권 10건, 1,000원
};

// 미니앱의 IAP.createOneTimePurchaseOrder onEvent(success)에서 호출한다.
// mTLS 인증서가 설정돼 있으면 앱인토스 서버에 주문 상태를 실제로 조회해 검증한다.
// 아직 인증서가 없으면 MOCK_IAP=true일 때만(로컬 테스트용) 무검증으로 지급한다.
export async function POST(req: NextRequest) {
  const userId = await getMobileUserId(req);
  if (!userId) return json(req, { error: "로그인이 필요합니다." }, 401);

  const { orderId, sku } = (await req.json().catch(() => ({}))) as { orderId?: string; sku?: string };
  if (!sku || !PRODUCTS[sku]) return json(req, { error: "알 수 없는 상품이에요." }, 400);
  const credits = PRODUCTS[sku];

  const already = orderId ? await prisma.purchase.findFirst({ where: { productId: orderId } }) : null;
  if (already) return json(req, { error: "이미 처리된 주문이에요." }, 409);

  if (isMtlsConfigured()) {
    if (!orderId) return json(req, { error: "주문번호가 없어요." }, 400);
    let status;
    try {
      status = await getOrderStatus(orderId);
    } catch (e) {
      console.error("[iap] order status lookup failed:", e);
      return json(req, { error: "결제 확인에 실패했어요. 잠시 후 다시 시도해 주세요." }, 502);
    }
    if (status.sku !== sku) return json(req, { error: "상품 정보가 일치하지 않아요." }, 400);
    if (status.status !== "PURCHASED" && status.status !== "PAYMENT_COMPLETED") {
      return json(req, { error: `결제가 완료되지 않았어요 (${status.status}).` }, 402);
    }
    await prisma.purchase.create({ data: { userId, productId: orderId, credits, verified: true } });
  } else {
    if (process.env.MOCK_IAP !== "true") {
      return json(req, { error: "결제 충전은 아직 준비 중이에요." }, 501);
    }
    await prisma.purchase.create({ data: { userId, productId: orderId ?? sku, credits, verified: false } });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: credits } },
  });

  return json(req, { credits: user.credits });
}
