import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { getChallenge } from "@/lib/webauthn-challenge-store";
import { getRpConfig } from "@/lib/webauthn-config";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_change_me");

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const adminId = parseInt(payload.sub as string);

        const expectedChallenge = getChallenge(`register:${adminId}`);
        if (!expectedChallenge) return NextResponse.json({ error: "Challenge expired" }, { status: 400 });

        const body = await req.json();
        const { rpID, origin } = getRpConfig();

        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });

        if (!verification.verified || !verification.registrationInfo) {
            return NextResponse.json({ error: "Verification failed" }, { status: 400 });
        }

        const { credential } = verification.registrationInfo;

        await prisma.passkeyCredential.create({
            data: {
                adminId,
                credentialId: credential.id,
                publicKey: Buffer.from(credential.publicKey),
                counter: BigInt(credential.counter),
            },
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
