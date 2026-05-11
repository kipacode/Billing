import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const { invoiceIds, paidDate, method } = await request.json();

        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return NextResponse.json({ error: "Missing invoice IDs" }, { status: 400 });
        }

        const date = new Date(paidDate);

        // Perform updates in a transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            for (const id of invoiceIds) {
                // 1. Update Invoice
                const invoice = await tx.invoice.update({
                    where: { id },
                    data: {
                        status: "paid",
                        paidDate: date,
                    },
                });

                // 2. Create/Update Payment
                await tx.payment.upsert({
                    where: { invoiceId: id },
                    update: {
                        paidAt: date,
                        amount: invoice.total,
                        method: method || "cash",
                    },
                    create: {
                        invoiceId: id,
                        amount: invoice.total,
                        paidAt: date,
                        method: method || "cash",
                    },
                });
            }
        });

        return NextResponse.json({ success: true, count: invoiceIds.length });
    } catch (error) {
        console.error("Error in bulk payment:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
