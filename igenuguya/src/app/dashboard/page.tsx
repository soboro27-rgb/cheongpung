import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/");

  const batches = await prisma.batch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { contacts: true },
  });

  return (
    <DashboardClient
      nickname={user.nickname}
      batches={batches.map((b) => ({
        id: b.id,
        messageText: b.messageText,
        createdAt: b.createdAt.toISOString(),
        total: b.contacts.length,
        keep: b.contacts.filter((c) => c.status === "KEEP").length,
        release: b.contacts.filter((c) => c.status === "RELEASE").length,
        pending: b.contacts.filter((c) => c.status === "PENDING" || c.status === "SENT").length,
      }))}
    />
  );
}
