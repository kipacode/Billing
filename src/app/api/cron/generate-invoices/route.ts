import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Generates invoices for all active customers for a given month/year.
 * - Skips customers who already have an invoice for that period.
 * - Due date is set to the 20th of the billing month.
 *
 * Can be triggered by:
 *   1. Vercel Cron (automatic, 1st of every month)
 *   2. Manual POST from the Invoices page (admin-initiated)
 */
async function generateMonthlyInvoices(month: number, year: number) {
    const customers = await prisma.customer.findMany({
        where: { status: "active" },
        include: { plan: true },
    });

    let created = 0;
    let skipped = 0;

    for (const customer of customers) {
        const billingMonthStr = month.toString().padStart(2, "0");
        const invoiceNumber = `INV-${year}-${billingMonthStr}-${customer.id
            .toString()
            .padStart(3, "0")}`;

        // Skip if invoice already exists for this customer+period
        const existing = await prisma.invoice.findUnique({
            where: { invoiceNumber },
        });

        if (existing) {
            skipped++;
            continue;
        }

        const amount = customer.plan.price;
        const discount = customer.discount;
        const total = amount - discount;
        const dueDate = new Date(year, month - 1, 20); // 20th of the month

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
        created++;
    }

    return { created, skipped, month, year };
}

// GET — Called by Vercel Cron on the 1st of every month
export async function GET(request: Request) {
    try {
        // Verify cron secret (Vercel sends this automatically)
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();

        const result = await generateMonthlyInvoices(month, year);

        console.log(
            `[CRON] Invoice generation complete: ${result.created} created, ${result.skipped} skipped for ${month}/${year}`
        );

        return NextResponse.json({
            success: true,
            message: `Generated invoices for ${month}/${year}`,
            ...result,
        });
    } catch (error) {
        console.error("[CRON] Invoice generation failed:", error);
        return NextResponse.json(
            { error: "Invoice generation failed" },
            { status: 500 }
        );
    }
}

// POST — Called manually from the admin Invoices page
export async function POST(request: Request) {
    try {
        const { month, year } = await request.json();

        if (!month || !year) {
            return NextResponse.json(
                { error: "month and year are required" },
                { status: 400 }
            );
        }

        const result = await generateMonthlyInvoices(
            parseInt(month, 10),
            parseInt(year, 10)
        );

        return NextResponse.json({
            success: true,
            message: `Generated invoices for ${result.month}/${result.year}`,
            ...result,
        });
    } catch (error) {
        console.error("Manual invoice generation failed:", error);
        return NextResponse.json(
            { error: "Invoice generation failed" },
            { status: 500 }
        );
    }
}
