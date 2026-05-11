import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const start = new Date(2026, 0, 1); // Jan 1st
  const end = new Date(2026, 3, 30, 23, 59, 59); // Apr 30th

  console.log("Updating all operationals from Jan to April 2026 to 'paid' status...");

  const result = await prisma.operational.updateMany({
    where: {
      expenseDate: {
        gte: start,
        lte: end,
      },
    },
    data: {
      status: 'paid',
    },
  });

  // Note: updateMany doesn't support setting fields to the value of other fields in Prisma yet.
  // We need to fetch and update individually to set paidDate = expenseDate.
  const opsToUpdate = await prisma.operational.findMany({
    where: {
      expenseDate: {
        gte: start,
        lte: end,
      },
    },
  });

  for (const op of opsToUpdate) {
    await prisma.operational.update({
      where: { id: op.id },
      data: {
        paidDate: op.expenseDate,
      },
    });
  }

  console.log(`Successfully updated ${result.count} items to paid status with payment dates set.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
