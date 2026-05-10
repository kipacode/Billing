import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    try {
        const filters: any = {};
        if (month) filters.billingMonth = parseInt(month, 10);
        if (year) filters.billingYear = parseInt(year, 10);

        // 1. Total Revenue (from Paid invoices matching month/year)
        const paidInvoices = await prisma.invoice.aggregate({
            where: { ...filters, status: "paid" },
            _sum: { total: true },
        });
        const revenue = paidInvoices._sum.total || 0;

        // 2. Active Customers Count
        const activeCustomers = await prisma.customer.count({
            where: { status: "active" },
        });

        // 3. Pending/Overdue counts
        const pendingInvoices = await prisma.invoice.count({
            where: { ...filters, status: "unpaid" },
        });
        const overdueInvoices = await prisma.invoice.count({
            where: { ...filters, status: "overdue" },
        });

        // 4. Overdue Invoices List (for the table)
        const overdueList = await prisma.invoice.findMany({
            where: { ...filters, status: "overdue" },
            include: { customer: true },
            orderBy: { dueDate: "asc" },
            take: 5,
        });

        // 5. Total Operationals
        let opFilters: any = {};
        if (month && year) {
            // Find operationals in that specific month and year
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 0, 23, 59, 59, 999);
            opFilters.expenseDate = {
                gte: startDate,
                lte: endDate,
            };
        }
        const ops = await prisma.operational.aggregate({
            where: opFilters,
            _sum: { amount: true },
        });
        const operationals = ops._sum.amount || 0;

        const profit = revenue - operationals;

        return NextResponse.json({
            revenue,
            activeCustomers,
            pendingInvoices,
            overdueInvoices,
            overdueList,
            operationals,
            profit,
        });
    } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
