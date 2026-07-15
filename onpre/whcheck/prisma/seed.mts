import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@whcheck.io";
  const password = process.env.ADMIN_PASSWORD ?? "whcheck2024!";
  const exists = await prisma.adminUser.findUnique({ where: { email } });
  if (exists) { console.log("Admin already exists"); return; }
  await prisma.adminUser.create({ data: { email, passwordHash: await hash(password, 12) } });
  console.log(`Admin created: ${email}`);
}
main().finally(() => prisma.$disconnect());
