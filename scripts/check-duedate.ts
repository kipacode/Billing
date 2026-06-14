import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.invoice.findMany({
        take: 5,
        orderBy: { id: "desc" },
        select: { id: true, invoiceNumber: true, dueDate: true, status: true }
    });
    console.log(invoices);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
