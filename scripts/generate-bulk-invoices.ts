import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting bulk invoice generation...");
    
    // Get all customers with their plan
    const customers = await prisma.customer.findMany({
        include: { plan: true },
    });

    const year = 2026;
    const months = [1, 2, 3]; // Januari, Februari, Maret
    let createdCount = 0;
    let skippedCount = 0;

    for (const customer of customers) {
        for (const month of months) {
            const billingMonthStr = month.toString().padStart(2, '0');
            const invoiceNumber = `INV-${year}-${billingMonthStr}-${customer.id.toString().padStart(3, '0')}`;
            
            // Check if invoice already exists
            const existing = await prisma.invoice.findUnique({
                where: { invoiceNumber },
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            const amount = customer.plan.price;
            const discount = customer.discount;
            const total = amount - discount;
            const dueDate = new Date(year, month - 1, 10); // 10th of the month

            await prisma.invoice.create({
                data: {
                    customerId: customer.id,
                    invoiceNumber,
                    billingMonth: month,
                    billingYear: year,
                    amount,
                    discount,
                    total,
                    status: "unpaid",
                    dueDate,
                },
            });
            createdCount++;
        }
    }

    console.log(`Generation complete.`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Skipped (already exists): ${skippedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
