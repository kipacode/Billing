import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: { plan: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const customer = await prisma.customer.create({
            data: {
                name: json.name,
                address: json.address,
                area: json.area,
                whatsapp: json.whatsapp,
                planId: json.planId,
                discount: json.discount || 0,
                status: json.status || "active",
                registrationDate: new Date(json.registrationDate),
            },
            include: { plan: true },
        });
        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
