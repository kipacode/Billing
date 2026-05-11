import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const mayStart = new Date(2026, 4, 1);
  const mayEnd = new Date(2026, 4, 31, 23, 59, 59);

  const mayOps = await prisma.operational.findMany({
    where: {
      expenseDate: {
        gte: mayStart,
        lte: mayEnd,
      },
    },
  });

  if (mayOps.length === 0) {
    console.log("No operationals found in May 2026 to duplicate.");
    return;
  }

  console.log(`Found ${mayOps.length} items in May. Duplicating to Jan, Feb, Mar, Apr...`);

  for (let month = 0; month <= 3; month++) { // 0=Jan, 1=Feb, 2=Mar, 3=Apr
    for (const op of mayOps) {
      const newDate = new Date(op.expenseDate);
      newDate.setMonth(month);
      
      await prisma.operational.create({
        data: {
          name: op.name,
          amount: op.amount,
          expenseDate: newDate,
          status: op.status,
          paidDate: op.paidDate,
        },
      });
    }
  }

  console.log("Duplication complete!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
