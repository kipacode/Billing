import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.invoice.findMany({
        where: { billingYear: 2026 },
        orderBy: [{ customerId: 'asc' }, { billingMonth: 'asc' }],
        take: 10
    });
    console.log("Invoice samples:", JSON.stringify(invoices, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
