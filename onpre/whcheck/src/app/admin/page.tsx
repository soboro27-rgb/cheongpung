import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">캠페인 목록</h1>
        <Link href="/admin/campaigns/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          + 새 캠페인
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 text-gray-400">캠페인이 없습니다. 새 캠페인을 만들어 주세요.</div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <Link key={c.id} href={`/admin/campaigns/${c.id}`}
              className="block bg-white rounded-xl border border-gray-200 px-6 py-4 hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.returnTargetType} · 만료 {new Date(c.expiresAt).toLocaleDateString("ko")}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    ACTIVE: "bg-green-100 text-green-700",
    CLOSED: "bg-yellow-100 text-yellow-700",
    EXPIRED: "bg-red-100 text-red-600",
  };
  const label: Record<string, string> = { DRAFT: "초안", ACTIVE: "진행중", CLOSED: "완료", EXPIRED: "만료" };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? ""}`}>{label[status] ?? status}</span>;
}
