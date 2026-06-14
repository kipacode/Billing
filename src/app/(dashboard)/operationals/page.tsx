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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Wallet, CheckCircle2, Search, Zap } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { MonthYearFilter } from "@/components/MonthYearFilter";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatIDR } from "@/lib/formatCurrency";

type OpStatus = "paid" | "unpaid" | "overdue";

interface Operational {
    id: number;
    name: string;
    amount: number;
    expenseDate: string;
    status: OpStatus;
    paidDate?: string | null;
}

const STATUS_LABELS: Record<OpStatus, string> = {
    paid: "Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
};

const STATUS_VARIANT: Record<OpStatus, "default" | "secondary" | "destructive"> = {
    paid: "default",
    unpaid: "secondary",
    overdue: "destructive",
};

type FilterTab = "all" | OpStatus;

export default function OperationalsPage() {
    const [ops, setOps] = useState<Operational[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editOp, setEditOp] = useState<Operational | null>(null);
    const [deleteOp, setDeleteOp] = useState<Operational | null>(null);
    const [payOp, setPayOp] = useState<Operational | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const [tab, setTab] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");
    
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/operationals?month=${month}&year=${year}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            
            // Auto check overdue based on current date if unpaid
            const today = new Date().getTime();
            const processed = data.map((op: Operational) => {
                if (op.status === "unpaid" && new Date(op.expenseDate).getTime() < today) {
                    return { ...op, status: "overdue" };
                }
                return op;
            });
            setOps(processed);
        } catch (error) {
            toast.error("Gagal memuat data operasional");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const newOp = {
            name: fd.get("name") as string,
            amount: Number(fd.get("amount")),
            expenseDate: fd.get("expenseDate") as string,
        };

        try {
            const res = await fetch("/api/operationals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOp),
            });
            if (!res.ok) throw new Error("Gagal");

            await fetchData();
            setIsAddOpen(false);
            toast.success("Operasional berhasil ditambahkan!");
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editOp) return;
        const fd = new FormData(e.currentTarget);
        const updated = {
            name: fd.get("name") as string,
            amount: Number(fd.get("amount")),
            expenseDate: fd.get("expenseDate") as string,
        };

        try {
            const res = await fetch(`/api/operationals/${editOp.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            if (!res.ok) throw new Error("Gagal");

            await fetchData();
            setEditOp(null);
            toast.success("Operasional berhasil diperbarui!");
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleDelete = async () => {
        if (!deleteOp) return;
        try {
            const res = await fetch(`/api/operationals/${deleteOp.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal");

            await fetchData();
            setDeleteOp(null);
            toast.success("Operasional berhasil dihapus!");
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };
    
    const handleMarkPaid = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!payOp) return;
        const fd = new FormData(e.currentTarget);
        const paidDate = fd.get("paidDate") as string;

        try {
            const res = await fetch(`/api/operationals/${payOp.id}/pay`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "paid", paidDate }),
            });
            if (!res.ok) throw new Error("Gagal");

            await fetchData();
            setPayOp(null);
            toast.success(`Operasional ${payOp.name} berhasil ditandai lunas.`);
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/operationals/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, year }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal");

            if (data.created > 0) {
                toast.success(`${data.created} operasional berhasil dibuat untuk ${month}/${year}`);
                await fetchData();
            } else {
                toast.info("Semua operasional untuk periode ini sudah ada.");
            }
        } catch (error) {
            toast.error("Gagal generate operasional");
        } finally {
            setIsGenerating(false);
        }
    };

    const filtered = ops.filter((op) => {
        if (tab !== "all" && op.status !== tab) return false;
        if (
            search &&
            !op.name.toLowerCase().includes(search.toLowerCase())
        )
            return false;
        return true;
    });

    const counts = useMemo(() => ({
        all: ops.length,
        paid: ops.filter(i => i.status === "paid").length,
        unpaid: ops.filter(i => i.status === "unpaid").length,
        overdue: ops.filter(i => i.status === "overdue").length,
    }), [ops]);

    const totalExpense = ops.reduce((sum, o) => sum + o.amount, 0);
    const paidExpense = ops.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amount, 0);

    const tabs: { label: string; value: FilterTab }[] = [
        { label: "Semua", value: "all" },
        { label: "Paid", value: "paid" },
        { label: "Unpaid", value: "unpaid" },
        { label: "Overdue", value: "overdue" },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Operasional</h1>
                    <p className="text-muted-foreground">
                        Catat dan kelola biaya operasional jaringan.
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
                        variant="outline"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        <Zap className="mr-1.5 h-3.5 w-3.5" />
                        {isGenerating ? "Generating..." : "Generate"}
                    </Button>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        {/* @ts-expect-error React 19 typing conflict with Radix */}
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Tambah Operasional
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Tambah Biaya Operasional</DialogTitle>
                                <DialogDescription>Catat pengeluaran baru.</DialogDescription>
                            </DialogHeader>
                            <OpForm onSubmit={handleAdd} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-2 stagger-children">
                <Card className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Paid Pengeluaran</CardTitle>
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <div className="text-2xl font-bold">{formatIDR(paidExpense)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Sudah dibayar
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <Wallet className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <div className="text-2xl font-bold">{formatIDR(totalExpense)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {ops.length} item pengeluaran
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Tabs */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari operasional..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

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
            </div>

            {/* Mobile card list */}
            <div className="flex flex-col gap-2.5 md:hidden">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                        Tidak ada biaya operasional ditemukan.
                    </div>
                ) : (
                    filtered.map((op) => (
                        <div
                            key={op.id}
                            className="rounded-xl border bg-card p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate font-semibold">{op.name}</span>
                                        <Badge variant={STATUS_VARIANT[op.status]} className="shrink-0">
                                            {STATUS_LABELS[op.status]}
                                        </Badge>
                                    </div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                        Jatuh tempo {new Date(op.expenseDate).toLocaleDateString("id-ID")}
                                    </div>
                                    <div className="mt-1.5 text-lg font-bold tracking-tight">
                                        {formatIDR(op.amount)}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    {/* @ts-expect-error React 19 typing conflict with Radix */}
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="shrink-0">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditOp(op)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => setDeleteOp(op)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Hapus
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {op.status !== "paid" ? (
                                <Button
                                    onClick={() => setPayOp(op)}
                                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Tandai Lunas
                                </Button>
                            ) : (
                                <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
                                    Lunas {op.paidDate ? new Date(op.paidDate).toLocaleDateString("id-ID") : ""}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Table (desktop) */}
            <div className="hidden rounded-lg border bg-card overflow-x-auto md:block">
                <Table className="min-w-[650px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jumlah (IDR)</TableHead>
                            <TableHead>Jatuh Tempo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Tidak ada biaya operasional ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((op) => (
                                <TableRow key={op.id}>
                                    <TableCell className="font-medium">{op.name}</TableCell>
                                    <TableCell className="font-semibold">{formatIDR(op.amount)}</TableCell>
                                    <TableCell>{new Date(op.expenseDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[op.status]}>
                                            {STATUS_LABELS[op.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {op.status !== "paid" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setPayOp(op)}
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                                    Bayar
                                                </Button>
                                            )}
                                            {op.status === "paid" && (
                                                <span className="text-xs text-muted-foreground mr-2">
                                                    {op.paidDate ? new Date(op.paidDate).toLocaleDateString() : ""}
                                                </span>
                                            )}
                                            <DropdownMenu>
                                                {/* @ts-expect-error React 19 typing conflict with Radix */}
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditOp(op)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteOp(op)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pay Dialog */}
            <Dialog
                open={!!payOp}
                onOpenChange={(open) => !open && setPayOp(null)}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Tandai Lunas</DialogTitle>
                        <DialogDescription>
                            Konfirmasi pembayaran untuk {payOp?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleMarkPaid}>
                        <div className="grid gap-4 py-4">
                            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                                <span className="text-sm text-muted-foreground">Total</span>
                                <span className="text-lg font-bold">
                                    {payOp && formatIDR(payOp.amount)}
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

            {/* Edit Dialog */}
            <Dialog
                open={!!editOp}
                onOpenChange={(open) => !open && setEditOp(null)}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Edit Operasional</DialogTitle>
                        <DialogDescription>Perbarui data operasional.</DialogDescription>
                    </DialogHeader>
                    {editOp && <OpForm onSubmit={handleEdit} defaults={editOp} />}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteOp}
                onOpenChange={(open) => !open && setDeleteOp(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Operasional?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus <strong>{deleteOp?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function OpForm({
    onSubmit,
    defaults,
}: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    defaults?: Operational;
}) {
    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nama Operasional</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={defaults?.name}
                        placeholder="e.g. Biaya Listrik"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Jumlah (Rp)</Label>
                    <Input
                        id="amount"
                        name="amount"
                        type="number"
                        defaultValue={defaults?.amount}
                        placeholder="500000"
                        min={0}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="expenseDate">Jatuh Tempo / Tanggal</Label>
                    <Input
                        id="expenseDate"
                        name="expenseDate"
                        type="date"
                        defaultValue={defaults?.expenseDate ? new Date(defaults.expenseDate).toISOString().split('T')[0] : ""}
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit">Simpan</Button>
            </DialogFooter>
        </form>
    );
}
