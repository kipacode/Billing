import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const { username, password } = body;

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const data: any = { username };

        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const admin = await prisma.admin.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                createdAt: true,
            },
        });

        return NextResponse.json(admin);
    } catch (error) {
        console.error("Failed to update admin:", error);
        return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        // Check if it's the last admin
        const adminCount = await prisma.admin.count();
        if (adminCount <= 1) {
            return NextResponse.json({ error: "Cannot delete the last administrator" }, { status: 400 });
        }

        await prisma.admin.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete admin:", error);
        return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
    }
}
