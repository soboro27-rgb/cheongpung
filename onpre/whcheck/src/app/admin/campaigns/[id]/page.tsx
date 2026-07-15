import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import UploadSection from "./UploadSection";
import SendSection from "./SendSection";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { recipients: true } } },
  });
  if (!campaign) notFound();

  const stats = await prisma.recipientToken.groupBy({
    by: ["status"],
    where: { campaignId: campaign.id },
    _count: true,
  });
  const statMap = Object.fromEntries(stats.map(s => [s.status, s._count]));
  const total = campaign._count.recipients;

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "미발송",
    SENT: "발송완료",
    VIEWED: "열람",
    CONFIRMED: "확인완료",
    MODIFIED: "수정완료",
    FAILED: "실패",
    EXPIRED: "만료",
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700 text-sm">← 목록</Link>
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        {campaign.returnTargetType} · 만료 {new Date(campaign.expiresAt).toLocaleString("ko")}
      </p>

      {/* 진행 현황 (비식별 카운트만) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold mb-3">
          진행 현황 <span className="text-gray-400 font-normal text-sm">(총 {total}건)</span>
        </h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <div key={k} className="text-center">
              <p className="text-2xl font-bold text-blue-700">{statMap[k] ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <UploadSection campaignId={campaign.id} />
      <SendSection campaignId={campaign.id} campaignStatus={campaign.status} />
    </div>
  );
}
