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
                name: json.name,
                amount: json.amount,
                expenseDate: new Date(json.expenseDate),
            },
        });
        return NextResponse.json(operational);
    } catch (error) {
        console.error("Error updating operational:", error);
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
        await prisma.operational.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting operational:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
