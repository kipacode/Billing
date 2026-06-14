import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { setChallenge } from "@/lib/webauthn-challenge-store";
import { getRpConfig } from "@/lib/webauthn-config";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_change_me");

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const adminId = parseInt(payload.sub as string);

        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            include: { passkeys: true },
        });
        if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { rpName, rpID } = getRpConfig();

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: new TextEncoder().encode(admin.id.toString()),
            userName: admin.username,
            userDisplayName: admin.username,
            attestationType: "none",
            excludeCredentials: admin.passkeys.map((p) => ({
                id: p.credentialId,
                type: "public-key" as const,
            })),
            authenticatorSelection: {
                residentKey: "preferred",
                userVerification: "preferred",
            },
        });

        setChallenge(`register:${adminId}`, options.challenge);

        return NextResponse.json(options);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
