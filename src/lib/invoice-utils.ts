import { prisma } from "./db";

/**
 * Updates all "unpaid" invoices that are past their due date to "overdue".
 */
export async function updateOverdueInvoices() {
    try {
        const now = new Date();
        
        const result = await prisma.invoice.updateMany({
            where: {
                status: "unpaid",
                dueDate: {
                    lt: now,
                },
            },
            data: {
                status: "overdue",
            },
        });

        if (result.count > 0) {
            console.log(`[Status Update] ${result.count} invoices updated to overdue.`);
        }
        
        return result.count;
    } catch (error) {
        console.error("Error updating overdue invoices:", error);
        return 0;
    }
}
