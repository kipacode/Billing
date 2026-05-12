import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // --- Admin ---
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.admin.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            passwordHash: hashedPassword,
        },
    });
    console.log("✓ Admin seeded (username: admin)");

    // --- Plans ---
    const basic = await prisma.plan.upsert({
        where: { id: 1 },
        update: {},
        create: { name: "Basic", speedMbps: 5, price: 120000 },
    });
    const standard = await prisma.plan.upsert({
        where: { id: 2 },
        update: {},
        create: { name: "Standard", speedMbps: 8, price: 150000 },
    });
    const premium = await prisma.plan.upsert({
        where: { id: 3 },
        update: {},
        create: { name: "Premium", speedMbps: 10, price: 200000 },
    });

    console.log("✓ Plans seeded:", basic.name, standard.name, premium.name);

    // --- Customers ---
    const customers = [
        { name: "Budi Santoso", address: "Jl. Merdeka No. 45", area: 1, whatsapp: "081234567890", planId: basic.id, discount: 0, status: "active", registrationDate: new Date("2026-01-01") },
        { name: "Siti Aminah", address: "Jl. Sudirman Blok C", area: 2, whatsapp: "081987654321", planId: standard.id, discount: 10000, status: "active", registrationDate: new Date("2026-01-01") },
        { name: "Andi Wijaya", address: "Perumahan Asri Indah", area: 1, whatsapp: "082211334455", planId: premium.id, discount: 0, status: "suspended", registrationDate: new Date("2026-01-01") },
        { name: "Rina Marlina", address: "Jl. Kenangan No. 12", area: 3, whatsapp: "081345678901", planId: basic.id, discount: 20000, status: "active", registrationDate: new Date("2026-01-01") },
        { name: "Deni Hermawan", address: "Jl. Anggrek No. 7", area: 5, whatsapp: "089912345678", planId: standard.id, discount: 0, status: "active", registrationDate: new Date("2026-01-01") },
    ];

    for (const c of customers) {
        await prisma.customer.upsert({
            where: { id: customers.indexOf(c) + 1 },
            update: {},
            create: c,
        });
    }
    console.log("✓ Customers seeded:", customers.length);

    // --- Invoices for March 2026 ---
    const invoiceData = [
        { customerId: 1, invoiceNumber: "INV-2026-03-001", billingMonth: 3, billingYear: 2026, amount: 120000, discount: 0, total: 120000, status: "unpaid", dueDate: new Date("2026-03-20") },
        { customerId: 2, invoiceNumber: "INV-2026-03-002", billingMonth: 3, billingYear: 2026, amount: 150000, discount: 10000, total: 140000, status: "paid", dueDate: new Date("2026-03-20"), paidDate: new Date("2026-03-10") },
        { customerId: 3, invoiceNumber: "INV-2026-03-003", billingMonth: 3, billingYear: 2026, amount: 200000, discount: 0, total: 200000, status: "overdue", dueDate: new Date("2026-03-20") },
        { customerId: 4, invoiceNumber: "INV-2026-03-004", billingMonth: 3, billingYear: 2026, amount: 120000, discount: 20000, total: 100000, status: "paid", dueDate: new Date("2026-03-20"), paidDate: new Date("2026-03-15") },
        { customerId: 5, invoiceNumber: "INV-2026-03-005", billingMonth: 3, billingYear: 2026, amount: 150000, discount: 0, total: 150000, status: "unpaid", dueDate: new Date("2026-03-20") },
    ];

    for (const inv of invoiceData) {
        await prisma.invoice.upsert({
            where: { invoiceNumber: inv.invoiceNumber },
            update: {},
            create: inv,
        });
    }
    console.log("✓ Invoices seeded:", invoiceData.length);

    // --- Payments for paid invoices ---
    const paidInvoices = await prisma.invoice.findMany({ where: { status: "paid" } });
    for (const inv of paidInvoices) {
        await prisma.payment.upsert({
            where: { invoiceId: inv.id },
            update: {},
            create: {
                invoiceId: inv.id,
                amount: inv.total,
                method: "transfer",
                paidAt: inv.paidDate ?? new Date(),
            },
        });
    }
    console.log("✓ Payments seeded:", paidInvoices.length);

    // --- Operationals ---
    const ops = [
        { name: "Biaya Listrik Server", amount: 500000, expenseDate: new Date("2026-03-01") },
        { name: "Sewa Tower", amount: 1200000, expenseDate: new Date("2026-03-01") },
        { name: "Kabel Fiber 100m", amount: 350000, expenseDate: new Date("2026-03-05") },
        { name: "Gaji Teknisi", amount: 2000000, expenseDate: new Date("2026-03-10") },
    ];

    for (const op of ops) {
        await prisma.operational.upsert({
            where: { id: ops.indexOf(op) + 1 },
            update: {},
            create: op,
        });
    }
    console.log("✓ Operationals seeded:", ops.length);

    // --- Reminder Templates ---
    await prisma.reminderTemplate.upsert({
        where: { type: "reminder" },
        update: {},
        create: {
            type: "reminder",
            templateContent: `Halo {{nama}},\n\nIni adalah pengingat bahwa iuran internet Anda sebesar {{total}} untuk bulan {{bulan}} sudah melewati jatuh tempo.\n\nMohon segera lakukan pembayaran. Terima kasih.\n\n— Admin ANFIELDNET`,
        },
    });

    await prisma.reminderTemplate.upsert({
        where: { type: "receipt" },
        update: {},
        create: {
            type: "receipt",
            templateContent: `Bukti Pembayaran Iuran Internet\n\nPelanggan: {{nama}}\nPeriode: {{bulan}}\nPaket: {{paket}} ({{harga}})\nTotal: {{total}}\nStatus: LUNAS\n\nTerima kasih atas pembayaran Anda!\n\n— Admin ANFIELDNET`,
        },
    });
    console.log("✓ Reminder templates seeded");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
