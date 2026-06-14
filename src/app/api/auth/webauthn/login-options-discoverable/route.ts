import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { setChallenge } from "@/lib/webauthn-challenge-store";
import { getRpConfig } from "@/lib/webauthn-config";

export async function POST() {
    try {
        const { rpID } = getRpConfig();

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: [],
            userVerification: "preferred",
        });

        setChallenge("discoverable", options.challenge);

        return NextResponse.json(options);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
