"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, FileWarning, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatIDR } from "@/lib/formatCurrency";

interface OverdueInvoice {
    id: number;
    invoiceNumber: string;
    total: number;
    dueDate: string;
    customer?: { name: string };
}

interface OverdueOp {
    id: number;
    name: string;
    amount: number;
    expenseDate: string;
}

export function NotificationBell() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<OverdueInvoice[]>([]);
    const [ops, setOps] = useState<OverdueOp[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, opRes] = await Promise.all([
                fetch("/api/invoices?status=overdue"),
                fetch("/api/operationals?status=unpaid"),
            ]);
            const invData: OverdueInvoice[] = invRes.ok ? await invRes.json() : [];
            const opData: OverdueOp[] = opRes.ok ? await opRes.json() : [];
            const now = Date.now();
            setInvoices(invData);
            setOps(opData.filter((o) => new Date(o.expenseDate).getTime() < now));
        } catch {
            // fail silently — bell just shows no notifications
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const count = invoices.length + ops.length;

    return (
        <DropdownMenu onOpenChange={(open) => { if (open) load(); }}>
            {/* @ts-expect-error React 19 typing conflict with Radix */}
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                    <Bell className="h-4 w-4" />
                    {count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                            {count > 9 ? "9+" : count}
                        </span>
                    )}
                    <span className="sr-only">Notifikasi</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[70vh]">
                <div className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-foreground">
                    Notifikasi
                    {count > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                            {count} perlu tindakan
                        </span>
                    )}
                </div>
                <DropdownMenuSeparator />

                {count === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                        {loading ? "Memuat…" : "Tidak ada notifikasi 🎉"}
                    </div>
                ) : (
                    <>
                        {invoices.length > 0 && (
                            <>
                                <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                    Invoice Overdue ({invoices.length})
                                </div>
                                {invoices.map((inv) => (
                                    <DropdownMenuItem
                                        key={`inv-${inv.id}`}
                                        onClick={() => router.push("/reminders")}
                                        className="flex items-start gap-2 px-2 py-2"
                                    >
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                                            <FileWarning className="h-3.5 w-3.5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {inv.customer?.name}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                Jatuh tempo {new Date(inv.dueDate).toLocaleDateString("id-ID")}
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold">
                                            {formatIDR(inv.total)}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}

                        {ops.length > 0 && (
                            <>
                                {invoices.length > 0 && <DropdownMenuSeparator />}
                                <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                    Operasional Overdue ({ops.length})
                                </div>
                                {ops.map((op) => (
                                    <DropdownMenuItem
                                        key={`op-${op.id}`}
                                        onClick={() => router.push("/operationals")}
                                        className="flex items-start gap-2 px-2 py-2"
                                    >
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                                            <Wrench className="h-3.5 w-3.5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">{op.name}</div>
                                            <div className="text-[11px] text-muted-foreground">
                                                Jatuh tempo {new Date(op.expenseDate).toLocaleDateString("id-ID")}
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold">
                                            {formatIDR(op.amount)}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
