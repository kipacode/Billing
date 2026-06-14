import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { PrismaClient } from "@prisma/client";
import { setChallenge } from "@/lib/webauthn-challenge-store";
import { getRpConfig } from "@/lib/webauthn-config";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { username } = await req.json();

        const admin = await prisma.admin.findUnique({
            where: { username },
            include: { passkeys: true },
        });

        if (!admin || admin.passkeys.length === 0) {
            return NextResponse.json({ error: "No passkey registered" }, { status: 404 });
        }

        const { rpID } = getRpConfig();

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: admin.passkeys.map((p) => ({
                id: p.credentialId,
                type: "public-key" as const,
            })),
            userVerification: "preferred",
        });

        setChallenge(`login:${admin.id}`, options.challenge);

        return NextResponse.json({ ...options, adminId: admin.id });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
