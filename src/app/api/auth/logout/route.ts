import { NextResponse } from "next/server";

export async function POST() {
    const res = NextResponse.json({ success: true });

    // Clear the cookie
    res.cookies.set("admin_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0), // Expire immediately
        path: "/",
    });

    return res;
}
