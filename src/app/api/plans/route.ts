import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { price: "asc" },
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error("Error fetching plans:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const plan = await prisma.plan.create({
            data: {
                name: json.name,
                speedMbps: json.speedMbps,
                price: json.price,
            },
        });
        return NextResponse.json(plan, { status: 201 });
    } catch (error) {
        console.error("Error creating plan:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
