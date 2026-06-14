import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_change_me");

export async function POST(req: Request) {
    try {
        const { username, password, rememberMe } = await req.json();

        // Find admin
        const admin = await prisma.admin.findUnique({
            where: { username },
        });

        if (!admin) {
            return NextResponse.json({ error: "Username tidak ditemukan" }, { status: 401 });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, admin.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: "Password salah" }, { status: 401 });
        }

        // Create JWT token
        const expiry = rememberMe ? "7d" : "24h";
        const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;

        const token = await new SignJWT({ sub: admin.id.toString(), username: admin.username })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(expiry)
            .sign(JWT_SECRET);

        const res = NextResponse.json({ success: true });
        res.cookies.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge,
            path: "/",
        });

        return res;
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
