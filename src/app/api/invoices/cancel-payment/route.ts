import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const { invoiceId } = await request.json();

        if (!invoiceId) {
            return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
        }

        // Perform cancellation in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Check if payment exists
            const payment = await tx.payment.findUnique({
                where: { invoiceId: invoiceId }
            });

            if (payment) {
                // 2. Delete the payment record
                await tx.payment.delete({
                    where: { invoiceId: invoiceId }
                });
            }

            // 3. Revert the invoice status to "unpaid"
            // Let the automated overdue logic handle if it should actually be "overdue".
            // For now, we set it back to "unpaid" and nullify the paidDate.
            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: "unpaid",
                    paidDate: null,
                },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error cancelling payment:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
