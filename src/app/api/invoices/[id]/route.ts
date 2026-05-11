import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id, 10);
        const json = await request.json();

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                status: json.status, // "paid"
                paidDate: json.paidDate ? new Date(json.paidDate) : null,
            },
        });

        // Automatically create a payment record if marked as paid
        if (json.status === "paid" && json.paidDate) {
            await prisma.payment.upsert({
                where: { invoiceId: id },
                update: {
                    paidAt: new Date(json.paidDate),
                    amount: invoice.total,
                    method: json.method || "cash",
                },
                create: {
                    invoiceId: id,
                    amount: invoice.total,
                    paidAt: new Date(json.paidDate),
                    method: json.method || "cash",
                },
            });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Error updating invoice:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
