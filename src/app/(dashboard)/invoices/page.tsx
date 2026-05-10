"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Search, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MonthYearFilter } from "@/components/MonthYearFilter";
import { toast } from "sonner";
import { formatIDR } from "@/lib/formatCurrency";

type InvoiceStatus = "paid" | "unpaid" | "overdue";

interface Invoice {
    id: number;
    invoiceNumber: string;
    customer: { name: string; whatsapp: string };
    total: number;
    billingMonth: number;
    billingYear: number;
    dueDate: string;
    status: InvoiceStatus;
    payment?: { paidDate: string } | null;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
    paid: "Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
};

const STATUS_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "destructive"> = {
    paid: "default",
    unpaid: "secondary",
    overdue: "destructive",
};

type FilterTab = "all" | InvoiceStatus;

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");
    const [tab, setTab] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");
    const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/invoices?month=${month}&year=${year}`);
            if (!res.ok) throw new Error("Failed");
            setInvoices(await res.json());
        } catch (error) {
            toast.error("Gagal memuat invoice");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [month, year]);

    const filtered = invoices.filter((inv) => {
        if (tab !== "all" && inv.status !== tab) return false;
        if (
            search &&
            !inv.customer?.name.toLowerCase().includes(search.toLowerCase()) &&
            !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
        )
            return false;
        return true;
    });

    // Count per status for tab badges
    const counts = useMemo(() => ({
        all: invoices.length,
        paid: invoices.filter(i => i.status === "paid").length,
        unpaid: invoices.filter(i => i.status === "unpaid").length,
        overdue: invoices.filter(i => i.status === "overdue").length,
    }), [invoices]);

    const handleMarkPaid = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!payInvoice) return;
        const fd = new FormData(e.currentTarget);
        const paidDate = fd.get("paidDate") as string;
        const method = fd.get("method") as string;

        try {
            const res = await fetch(`/api/invoices/${payInvoice.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paidDate, method }),
            });
            if (!res.ok) throw new Error("Gagal");

            await fetchInvoices();
            setPayInvoice(null);
            toast.success(`Invoice ${payInvoice.invoiceNumber} berhasil ditandai lunas.`);
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const tabs: { label: string; value: FilterTab }[] = [
        { label: "Semua", value: "all" },
        { label: "Paid", value: "paid" },
        { label: "Unpaid", value: "unpaid" },
        { label: "Overdue", value: "overdue" },
    ];

    const handleGenerateInvoices = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/cron/generate-invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, year }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal");

            if (data.created > 0) {
                toast.success(`${data.created} invoice berhasil dibuat untuk ${month}/${year}`);
                await fetchInvoices();
            } else {
                toast.info("Semua invoice untuk periode ini sudah ada.");
            }
        } catch (error) {
            toast.error("Gagal generate invoice");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoice</h1>
                    <p className="text-muted-foreground">
                        Kelola tagihan dan lacak pembayaran.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <MonthYearFilter
                        month={month}
                        year={year}
                        onMonthChange={setMonth}
                        onYearChange={setYear}
                    />
                    <Button
                        onClick={handleGenerateInvoices}
                        disabled={isGenerating}
                        size="sm"
                    >
                        <Zap className="mr-1.5 h-3.5 w-3.5" />
                        {isGenerating ? "Generating..." : "Generate"}
                    </Button>
                </div>
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 rounded-lg border bg-card p-1 overflow-x-auto">
                    {tabs.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setTab(t.value)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${tab === t.value
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            {t.label}
                            {!isLoading && counts[t.value] > 0 && (
                                <span className={`ml-1.5 text-xs ${tab === t.value ? "opacity-80" : "opacity-60"}`}>
                                    ({counts[t.value]})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari invoice atau pelanggan..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card overflow-x-auto">
                <Table className="min-w-[650px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Invoice</TableHead>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Jatuh Tempo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Tidak ada invoice ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium font-mono text-xs">{inv.invoiceNumber}</TableCell>
                                    <TableCell>{inv.customer?.name}</TableCell>
                                    <TableCell className="font-semibold">
                                        {formatIDR(inv.total)}
                                    </TableCell>
                                    <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[inv.status]}>
                                            {STATUS_LABELS[inv.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {inv.status !== "paid" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPayInvoice(inv)}
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            >
                                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                                Bayar
                                            </Button>
                                        )}
                                        {inv.status === "paid" && (
                                            <span className="text-xs text-muted-foreground">
                                                {inv.payment?.paidDate ? new Date(inv.payment.paidDate).toLocaleDateString() : ""}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pay Dialog */}
            <Dialog
                open={!!payInvoice}
                onOpenChange={(open) => !open && setPayInvoice(null)}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Tandai Lunas</DialogTitle>
                        <DialogDescription>
                            Konfirmasi pembayaran untuk {payInvoice?.invoiceNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleMarkPaid}>
                        <div className="grid gap-4 py-4">
                            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                                <span className="text-sm text-muted-foreground">Total</span>
                                <span className="text-lg font-bold">
                                    {payInvoice && formatIDR(payInvoice.total)}
                                </span>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="paidDate">Tanggal Pembayaran</Label>
                                <Input
                                    id="paidDate"
                                    name="paidDate"
                                    type="date"
                                    defaultValue={new Date().toISOString().split("T")[0]}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="method">Metode Pembayaran</Label>
                                <Select name="method" defaultValue="cash">
                                    <SelectTrigger id="method">
                                        <SelectValue placeholder="Pilih metode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="transfer">Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Konfirmasi Lunas
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
