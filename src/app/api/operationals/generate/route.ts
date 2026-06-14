import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const { month, year } = await request.json();

        if (!month || !year) {
            return NextResponse.json(
                { error: "month and year are required" },
                { status: 400 }
            );
        }

        const m = parseInt(month, 10);
        const y = parseInt(year, 10);

        // Get previous month's operationals as the template
        const prevMonth = m === 1 ? 12 : m - 1;
        const prevYear = m === 1 ? y - 1 : y;
        const prevStart = new Date(prevYear, prevMonth - 1, 1);
        const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

        const templates = await prisma.operational.findMany({
            where: {
                expenseDate: { gte: prevStart, lte: prevEnd },
            },
        });

        if (templates.length === 0) {
            return NextResponse.json({ created: 0, skipped: 0, message: "No operationals found in previous month" });
        }

        // Get existing operationals for target month to avoid duplicates
        const targetStart = new Date(y, m - 1, 1);
        const targetEnd = new Date(y, m, 0, 23, 59, 59, 999);
        const existing = await prisma.operational.findMany({
            where: { expenseDate: { gte: targetStart, lte: targetEnd } },
            select: { name: true },
        });
        const existingNames = new Set(existing.map((o) => o.name.toLowerCase()));

        let created = 0;
        let skipped = 0;

        for (const tmpl of templates) {
            if (existingNames.has(tmpl.name.toLowerCase())) {
                skipped++;
                continue;
            }

            // Preserve the same day-of-month, but in the target month
            const origDay = new Date(tmpl.expenseDate).getDate();
            const daysInMonth = new Date(y, m, 0).getDate();
            const day = Math.min(origDay, daysInMonth);
            const expenseDate = new Date(y, m - 1, day);

            await prisma.operational.create({
                data: {
                    name: tmpl.name,
                    amount: tmpl.amount,
                    expenseDate,
                },
            });
            created++;
        }

        return NextResponse.json({ created, skipped, month: m, year: y });
    } catch (error) {
        console.error("Operational generation failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
