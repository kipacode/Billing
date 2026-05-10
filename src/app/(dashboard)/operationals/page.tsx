"use client";

import { useState, useEffect } from "react";
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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatIDR } from "@/lib/formatCurrency";

interface Operational {
    id: number;
    name: string;
    amount: number;
    expenseDate: string;
}

export default function OperationalsPage() {
    const [ops, setOps] = useState<Operational[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editOp, setEditOp] = useState<Operational | null>(null);
    const [deleteOp, setDeleteOp] = useState<Operational | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/operationals");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setOps(data);
        } catch (error) {
            toast.error("Gagal memuat data operasional");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    const totalExpense = ops.reduce((sum, o) => sum + o.amount, 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Operasional</h1>
                    <p className="text-muted-foreground">
                        Catat dan kelola biaya operasional jaringan.
                    </p>
                </div>

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

            {/* Summary */}
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

            {/* Table */}
            <div className="rounded-lg border bg-card overflow-x-auto">
                <Table className="min-w-[500px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jumlah (IDR)</TableHead>
                            <TableHead>Tanggal</TableHead>
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
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : ops.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Belum ada biaya operasional.
                                </TableCell>
                            </TableRow>
                        ) : (
                            ops.map((op) => (
                                <TableRow key={op.id}>
                                    <TableCell className="font-medium">{op.name}</TableCell>
                                    <TableCell className="font-semibold">{formatIDR(op.amount)}</TableCell>
                                    <TableCell>{new Date(op.expenseDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
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
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

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
                    <Label htmlFor="expenseDate">Tanggal Pengeluaran</Label>
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
