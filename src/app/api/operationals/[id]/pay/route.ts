import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id, 10);
        const json = await request.json();

        const operational = await prisma.operational.update({
            where: { id },
            data: {
                status: json.status,
                paidDate: json.paidDate ? new Date(json.paidDate) : null,
            },
        });
        return NextResponse.json(operational);
    } catch (error) {
        console.error("Error paying operational:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
