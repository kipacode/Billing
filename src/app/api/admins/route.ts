import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                username: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(admins);
    } catch (error) {
        console.error("Failed to fetch admins:", error);
        return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
        }

        const existingAdmin = await prisma.admin.findUnique({
            where: { username },
        });

        if (existingAdmin) {
            return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                username,
                passwordHash,
            },
            select: {
                id: true,
                username: true,
                createdAt: true,
            },
        });

        return NextResponse.json(admin);
    } catch (error) {
        console.error("Failed to create admin:", error);
        return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
    }
}
