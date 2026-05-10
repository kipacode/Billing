import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const templates = await prisma.reminderTemplate.findMany();
        // Return them in an object for easier access by type: { reminder: "...", receipt: "..." }
        const result = templates.reduce((acc: Record<string, string>, curr: { type: string; templateContent: string; }) => {
            acc[curr.type] = curr.templateContent;
            return acc;
        }, {});

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const json = await request.json(); // expected { type: "reminder", content: "..." }

        const template = await prisma.reminderTemplate.upsert({
            where: { type: json.type },
            update: { templateContent: json.content },
            create: { type: json.type, templateContent: json.content },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error updating template:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
