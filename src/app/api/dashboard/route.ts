import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateOverdueInvoices } from "@/lib/invoice-utils";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    try {
        // Automatically sync overdue statuses before fetching metrics
        await updateOverdueInvoices();

        const filters: any = {};
        let dateRangeFilter: any = undefined;

        if (month && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            
            filters.billingMonth = m;
            filters.billingYear = y;

            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 0, 23, 59, 59, 999);
            
            dateRangeFilter = {
                gte: startDate,
                lte: endDate,
            };
        } else if (month) {
            filters.billingMonth = parseInt(month, 10);
        } else if (year) {
            filters.billingYear = parseInt(year, 10);
        }

        // 1. Total Revenue (Cash-Basis: from Payments made in the selected month/year)
        const paymentFilters: any = {};
        if (dateRangeFilter) {
            paymentFilters.paidAt = dateRangeFilter;
        }
        
        const payments = await prisma.payment.aggregate({
            where: paymentFilters,
            _sum: { amount: true },
        });
        const revenue = payments._sum.amount || 0;

        // 2. Active Customers Count
        const activeCustomers = await prisma.customer.count({
            where: { status: "active" },
        });

        // 3. Pending/Overdue counts (Accrual-Basis: invoices billed in selected month/year)
        const pendingInvoices = await prisma.invoice.count({
            where: { ...filters, status: "unpaid" },
        });
        const overdueInvoices = await prisma.invoice.count({
            where: { ...filters, status: "overdue" },
        });


        // 5. Total Operationals (Cash-Basis: expenses paid in the selected month/year)
        let opFilters: any = { status: "paid" };
        if (dateRangeFilter) {
            // Use paidDate instead of expenseDate for true cash-flow tracking
            opFilters.paidDate = dateRangeFilter;
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
