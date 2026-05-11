import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const ops = await prisma.operational.findMany({ take: 1 });
    console.log("Ops:", ops);
    const updated = await prisma.operational.update({
      where: { id: ops[0].id },
      data: { status: "unpaid" }
    });
    console.log("Update success:", updated);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
