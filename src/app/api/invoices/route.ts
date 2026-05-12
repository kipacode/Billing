import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateOverdueInvoices } from "@/lib/invoice-utils";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    try {
        // Automatically sync overdue statuses before fetching
        await updateOverdueInvoices();

        const filters: any = {};
        if (month) filters.billingMonth = parseInt(month, 10);
        if (year) filters.billingYear = parseInt(year, 10);
        if (status) filters.status = status;
        if (customerId) filters.customerId = parseInt(customerId, 10);

        const invoices = await prisma.invoice.findMany({
            where: filters,
            include: {
                customer: {
                    include: {
                        plan: true,
                    },
                },
                payment: true,
            },
            orderBy: { dueDate: "asc" },
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();

        // Fetch customer to snapshot their current plan price and discount
        const customer = await prisma.customer.findUnique({
            where: { id: json.customerId },
            include: { plan: true },
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const amount = customer.plan.price;
        const discount = customer.discount;
        const total = amount - discount;

        const invoice = await prisma.invoice.create({
            data: {
                customerId: json.customerId,
                invoiceNumber: json.invoiceNumber, // Or generate this on backend
                billingMonth: json.billingMonth,
                billingYear: json.billingYear,
                amount,
                discount,
                total,
                status: "unpaid",
                dueDate: new Date(json.dueDate),
            },
            include: { customer: true },
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error("Error creating invoice:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
