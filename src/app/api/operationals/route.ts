import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const operationals = await prisma.operational.findMany({
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
