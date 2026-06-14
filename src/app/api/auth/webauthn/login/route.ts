import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { getChallenge } from "@/lib/webauthn-challenge-store";
import { getRpConfig } from "@/lib/webauthn-config";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_change_me");

export async function POST(req: Request) {
    try {
        const { adminId, credential, discoverable } = await req.json();

        const passkey = await prisma.passkeyCredential.findUnique({
            where: { credentialId: credential.id },
            include: { admin: true },
        });

        if (!passkey) {
            return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
        }

        if (!discoverable && passkey.adminId !== adminId) {
            return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
        }

        const challengeKey = discoverable ? "discoverable" : `login:${adminId}`;
        const expectedChallenge = getChallenge(challengeKey);
        if (!expectedChallenge) return NextResponse.json({ error: "Challenge expired" }, { status: 400 });

        const { rpID, origin } = getRpConfig();

        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: passkey.credentialId,
                publicKey: passkey.publicKey,
                counter: Number(passkey.counter),
            },
        });

        if (!verification.verified) {
            return NextResponse.json({ error: "Verification failed" }, { status: 401 });
        }

        await prisma.passkeyCredential.update({
            where: { id: passkey.id },
            data: { counter: BigInt(verification.authenticationInfo.newCounter) },
        });

        const token = await new SignJWT({
            sub: passkey.admin.id.toString(),
            username: passkey.admin.username,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(JWT_SECRET);

        const res = NextResponse.json({ success: true });
        res.cookies.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return res;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
