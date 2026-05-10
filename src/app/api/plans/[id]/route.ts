import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15+, params is a Promise
) {
    try {
        const id = parseInt((await params).id, 10);
        const json = await request.json();

        const plan = await prisma.plan.update({
            where: { id },
            data: {
                name: json.name,
                speedMbps: json.speedMbps,
                price: json.price,
            },
        });
        return NextResponse.json(plan);
    } catch (error) {
        console.error("Error updating plan:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id, 10);
        await prisma.plan.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting plan:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
