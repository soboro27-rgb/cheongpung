import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

// 하루 무료 발송 한도. 이후엔 credits(유료 발송권)를 차감한다.
export const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3);

function isSameDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

export interface CreditCheck {
  ok: boolean;
  freeRemaining: number;
  creditsAvailable: number;
  creditsNeeded: number;
}

// count명을 보내는 데 필요한 무료/유료 한도를 계산만 하고 차감하지 않는다.
export function checkCredits(user: User, count: number, now = new Date()): CreditCheck {
  const freeUsedToday = user.freeSentDate && isSameDay(user.freeSentDate, now) ? user.freeSentCount : 0;
  const freeRemaining = Math.max(0, FREE_DAILY_LIMIT - freeUsedToday);
  const freeToUse = Math.min(count, freeRemaining);
  const creditsNeeded = count - freeToUse;
  return {
    ok: creditsNeeded <= user.credits,
    freeRemaining,
    creditsAvailable: user.credits,
    creditsNeeded,
  };
}

// 실제로 count명 분을 소비 처리한다(무료 우선, 부족분은 credits에서 차감).
// 호출 전 checkCredits로 충분한지 먼저 확인할 것.
export async function consumeCredits(userId: number, count: number, now = new Date()) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const freeUsedToday = user.freeSentDate && isSameDay(user.freeSentDate, now) ? user.freeSentCount : 0;
  const freeRemaining = Math.max(0, FREE_DAILY_LIMIT - freeUsedToday);
  const freeToUse = Math.min(count, freeRemaining);
  const creditsNeeded = count - freeToUse;

  await prisma.user.update({
    where: { id: userId },
    data: {
      freeSentCount: freeUsedToday + freeToUse,
      freeSentDate: now,
      credits: { decrement: creditsNeeded },
    },
  });
}
