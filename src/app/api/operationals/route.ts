import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");

    try {
        const filters: any = {};
        if (status) filters.status = status;

        if (month && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 0, 23, 59, 59, 999);
            filters.expenseDate = {
                gte: startDate,
                lte: endDate,
            };
        }

        const operationals = await prisma.operational.findMany({
            where: filters,
            orderBy: { expenseDate: "desc" },
        });
        return NextResponse.json(operationals);
    } catch (error) {
        console.error("Error fetching operationals:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const operational = await prisma.operational.create({
            data: {
                name: json.name,
                amount: json.amount,
                expenseDate: new Date(json.expenseDate),
            },
        });
        return NextResponse.json(operational, { status: 201 });
    } catch (error) {
        console.error("Error creating operational:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
