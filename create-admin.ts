import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin", 10);
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: {
      username: "admin",
      passwordHash,
    },
  });
  console.log("Admin created/updated:", admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
