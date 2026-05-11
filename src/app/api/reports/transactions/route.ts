import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    try {
        let dateRangeFilter: any = undefined;

        if (month && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 0, 23, 59, 59, 999);
            
            dateRangeFilter = {
                gte: startDate,
                lte: endDate,
            };
        }

        // 1. Get Revenue Transactions (Payments)
        const paymentFilters: any = {};
        if (dateRangeFilter) {
            paymentFilters.paidAt = dateRangeFilter;
        }

        const payments = await prisma.payment.findMany({
            where: paymentFilters,
            include: { 
                invoice: {
                    include: { customer: true }
                } 
            },
            orderBy: { paidAt: "desc" },
        });

        // 2. Get Expense Transactions (Operationals)
        let opFilters: any = { status: "paid" };
        if (dateRangeFilter) {
            opFilters.paidDate = dateRangeFilter;
        }

        const operationals = await prisma.operational.findMany({
            where: opFilters,
            orderBy: { paidDate: "desc" },
        });

        // 3. Format and Combine
        const revenueItems = payments.map((p: any) => ({
            id: `pay-${p.id}`,
            type: "revenue",
            date: p.paidAt,
            description: p.invoice?.customer?.name || "Pelanggan",
            reference: p.invoice?.invoiceNumber || "-",
            amount: p.amount,
            method: p.method,
        }));

        const expenseItems = operationals.map((op: any) => ({
            id: `op-${op.id}`,
            type: "expense",
            date: op.paidDate || op.expenseDate,
            description: op.name,
            reference: "Operasional",
            amount: -op.amount,
            method: "cash", // Assuming cash for operationals unless added later
        }));

        const combined = [...revenueItems, ...expenseItems].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json(combined);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
