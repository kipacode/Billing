import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id, 10);
        const currentYear = new Date().getFullYear();

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                plan: true,
                invoices: {
                    where: { billingYear: currentYear },
                    orderBy: { billingMonth: "desc" },
                    include: { payment: true },
                },
            },
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id, 10);
        const json = await request.json();

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name: json.name,
                address: json.address,
                area: json.area,
                whatsapp: json.whatsapp,
                planId: json.planId,
                discount: json.discount ?? 0,
                status: json.status,
                registrationDate: new Date(json.registrationDate),
            },
            include: { plan: true },
        });
        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id, 10);
        
        await prisma.$transaction([
            prisma.payment.deleteMany({ where: { invoice: { customerId: id } } }),
            prisma.invoice.deleteMany({ where: { customerId: id } }),
            prisma.customer.delete({ where: { id } }),
        ]);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
