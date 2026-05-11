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
import { CheckCircle2, Search, Zap, Send } from "lucide-react";
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
    customerId: number;
    invoiceNumber: string;
    customer: { name: string; whatsapp: string };
    total: number;
    billingMonth: number;
    billingYear: number;
    dueDate: string;
    status: InvoiceStatus;
    payment?: { paidAt: string; method: string } | null;
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
    const [mounted, setMounted] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");
    const [tab, setTab] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");
    const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
    const [managePaidInvoice, setManagePaidInvoice] = useState<Invoice | null>(null);
    const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingCustomerInvoices, setIsFetchingCustomerInvoices] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [receiptTemplate, setReceiptTemplate] = useState("");

    useEffect(() => {
        setMounted(true);
        // Fetch receipt template
        fetch("/api/reminder-templates")
            .then(res => res.json())
            .then(data => {
                setReceiptTemplate(data.receipt || "");
            })
            .catch(() => {});
    }, []);

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

    const handleRowClick = async (invoice: Invoice) => {
        if (invoice.status === "paid") {
            setManagePaidInvoice(invoice);
            return;
        }

        setPayInvoice(invoice);
        setSelectedIds([invoice.id]);
        setIsFetchingCustomerInvoices(true);
        try {
            // Fetch all unpaid and overdue invoices for this customer
            const res = await fetch(`/api/invoices?customerId=${invoice.customerId}`);
            if (!res.ok) throw new Error("Gagal");
            const allInvoices: Invoice[] = await res.json();
            setCustomerInvoices(allInvoices.filter(inv => inv.status !== "paid"));
        } catch (error) {
            toast.error("Gagal mengambil data tagihan pelanggan");
        } finally {
            setIsFetchingCustomerInvoices(false);
        }
    };

    const handleMarkPaid = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedIds.length === 0) return;
        const fd = new FormData(e.currentTarget);
        const paidDate = fd.get("paidDate") as string;
        const method = fd.get("method") as string;

        try {
            const res = await fetch(`/api/invoices/bulk-pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceIds: selectedIds, paidDate, method }),
            });
            if (!res.ok) throw new Error("Gagal");

            await fetchInvoices();
            setPayInvoice(null);
            setCustomerInvoices([]);
            setSelectedIds([]);
            toast.success(`${selectedIds.length} invoice berhasil ditandai lunas.`);
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleSendReceipt = (inv: Invoice) => {
        const message = receiptTemplate
            .replace("{{nama}}", inv.customer?.name || "")
            .replace("{{total}}", formatIDR(inv.total))
            .replace("{{bulan}}", `${inv.billingMonth}/${inv.billingYear}`);

        const w = inv.customer?.whatsapp || "";
        const waUrl = `https://wa.me/${w.replace(/^0/, "62")}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
        toast.success(`Membuka WhatsApp untuk ${inv.customer?.name}…`);
    };

    const handleCancelPayment = async (inv: Invoice) => {
        if (!confirm(`Yakin ingin membatalkan pembayaran untuk invoice ${inv.invoiceNumber}? Invoice ini akan kembali menjadi Unpaid/Overdue.`)) return;
        
        setIsCancelling(true);
        try {
            const res = await fetch("/api/invoices/cancel-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceId: inv.id }),
            });
            if (!res.ok) throw new Error("Gagal");
            
            toast.success(`Pembayaran invoice ${inv.invoiceNumber} dibatalkan.`);
            setManagePaidInvoice(null);
            await fetchInvoices();
        } catch (error) {
            toast.error("Terjadi kesalahan saat membatalkan pembayaran");
        } finally {
            setIsCancelling(false);
        }
    };

    const toggleInvoice = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === customerInvoices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(customerInvoices.map(i => i.id));
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

    if (!mounted) return null;

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
                                <TableRow
                                    key={inv.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleRowClick(inv)}
                                >
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
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRowClick(inv);
                                                }}
                                            >
                                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                                Bayar
                                            </Button>
                                        )}
                                        {inv.status === "paid" && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-medium">
                                                    {inv.payment?.paidAt ? new Date(inv.payment.paidAt).toLocaleDateString() : ""}
                                                </span>
                                                {inv.payment?.method && (
                                                    <span className="text-[10px] text-muted-foreground uppercase">
                                                        {inv.payment.method}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog
                open={!!payInvoice}
                onOpenChange={(open) => !open && setPayInvoice(null)}
            >
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Pembayaran Pelanggan</DialogTitle>
                        <DialogDescription>
                            Pilih invoice yang akan dibayar untuk <strong>{payInvoice?.customer?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleMarkPaid}>
                        <div className="grid gap-4 py-4">
                            {isFetchingCustomerInvoices ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : (
                                <div className="border rounded-md divide-y overflow-hidden">
                                    <div className="bg-muted/50 p-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300"
                                                checked={selectedIds.length === customerInvoices.length && customerInvoices.length > 0}
                                                onChange={toggleAll}
                                            />
                                            <span className="text-xs font-medium">Pilih Semua ({customerInvoices.length})</span>
                                        </div>
                                        <span className="text-xs font-bold">
                                            {formatIDR(customerInvoices.filter(i => selectedIds.includes(i.id)).reduce((acc, curr) => acc + curr.total, 0))}
                                        </span>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto">
                                        {customerInvoices.map((inv) => (
                                            <label
                                                key={inv.id}
                                                className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300"
                                                        checked={selectedIds.includes(inv.id)}
                                                        onChange={() => toggleInvoice(inv.id)}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase">
                                                            {new Date(inv.billingYear, inv.billingMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-semibold">{formatIDR(inv.total)}</span>
                                                    <Badge variant={inv.status === "overdue" ? "destructive" : "secondary"} className="text-[9px] px-1 h-3.5">
                                                        {STATUS_LABELS[inv.status]}
                                                    </Badge>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="paidDate">Tanggal</Label>
                                    <Input
                                        id="paidDate"
                                        name="paidDate"
                                        type="date"
                                        defaultValue={new Date().toISOString().split("T")[0]}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="method">Metode</Label>
                                    <Select name="method" defaultValue="cash">
                                        <SelectTrigger id="method">
                                            <SelectValue placeholder="Pilih" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={selectedIds.length === 0}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Konfirmasi Bayar {selectedIds.length > 0 && `(${selectedIds.length})`}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manage Paid Invoice Dialog */}
            <Dialog
                open={!!managePaidInvoice}
                onOpenChange={(open) => !open && setManagePaidInvoice(null)}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Detail Pembayaran</DialogTitle>
                        <DialogDescription>
                            Invoice <strong>{managePaidInvoice?.invoiceNumber}</strong> telah lunas.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {managePaidInvoice && (
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col gap-2 rounded-lg border p-4 bg-muted/30">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Pelanggan</span>
                                    <span className="font-medium">{managePaidInvoice.customer?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total Tagihan</span>
                                    <span className="font-medium text-emerald-600">{formatIDR(managePaidInvoice.total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Tanggal Bayar</span>
                                    <span className="font-medium">
                                        {managePaidInvoice.payment?.paidAt ? new Date(managePaidInvoice.payment.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Metode</span>
                                    <span className="font-medium uppercase">{managePaidInvoice.payment?.method || "-"}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-col gap-2">
                        <Button
                            type="button"
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => managePaidInvoice && handleSendReceipt(managePaidInvoice)}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Kirim Struk via WhatsApp
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            className="w-full"
                            onClick={() => managePaidInvoice && handleCancelPayment(managePaidInvoice)}
                            disabled={isCancelling}
                        >
                            {isCancelling ? "Membatalkan..." : "Batalkan Pembayaran"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
