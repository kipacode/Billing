import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.invoice.findMany();
    let updatedDates = 0;
    let revertedStatus = 0;
    const now = new Date();

    for (const invoice of invoices) {
        // Set dueDate to 20th of the billing month
        const newDueDate = new Date(invoice.billingYear, invoice.billingMonth - 1, 20);
        
        // Update dueDate in DB
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { dueDate: newDueDate }
        });
        updatedDates++;

        // If it was marked overdue, but the new dueDate is in the future, revert to unpaid
        if (invoice.status === "overdue" && now <= newDueDate) {
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: "unpaid" }
            });
            revertedStatus++;
        }
    }

    console.log(`Fixed dueDate for ${updatedDates} invoices.`);
    console.log(`Reverted status from 'overdue' to 'unpaid' for ${revertedStatus} invoices.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
