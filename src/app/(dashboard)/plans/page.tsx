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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

interface Plan {
    id: number;
    name: string;
    speedMbps: number;
    price: number;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editPlan, setEditPlan] = useState<Plan | null>(null);
    const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/plans");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setPlans(data);
        } catch (error) {
            toast.error("Gagal memuat data paket");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const newPlan = {
            name: fd.get("name") as string,
            speedMbps: Number(fd.get("speedMbps")),
            price: Number(fd.get("price")),
        };

        try {
            const res = await fetch("/api/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPlan),
            });
            if (!res.ok) throw new Error("Gagal");

            await fetchPlans();
            setIsAddOpen(false);
            toast.success("Paket berhasil ditambahkan!");
        } catch (err) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editPlan) return;
        const fd = new FormData(e.currentTarget);
        const updated = {
            name: fd.get("name") as string,
            speedMbps: Number(fd.get("speedMbps")),
            price: Number(fd.get("price")),
        };

        try {
            const res = await fetch(`/api/plans/${editPlan.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            if (!res.ok) throw new Error("Gagal");

            await fetchPlans();
            setEditPlan(null);
            toast.success("Paket berhasil diperbarui!");
        } catch (err) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleDelete = async () => {
        if (!deletePlan) return;
        try {
            const res = await fetch(`/api/plans/${deletePlan.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal");

            await fetchPlans();
            setDeletePlan(null);
            toast.success("Paket berhasil dihapus!");
        } catch (err) {
            toast.error("Terjadi kesalahan");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paket Layanan</h1>
                        {!isLoading && (
                            <Badge variant="secondary" className="text-xs font-normal">
                                {plans.length} paket
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Kelola paket internet dan harga.
                    </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    {/* @ts-expect-error React 19 typing conflict with Radix */}
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Paket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Tambah Paket Baru</DialogTitle>
                            <DialogDescription>Masukkan detail paket.</DialogDescription>
                        </DialogHeader>
                        <PlanForm onSubmit={handleAdd} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Mobile card list */}
            <div className="flex flex-col gap-2.5 md:hidden">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    ))
                ) : plans.length === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                        Belum ada paket.
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate font-semibold">{plan.name}</span>
                                    <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                                        {plan.speedMbps} Mbps
                                    </Badge>
                                </div>
                                <div className="mt-1 text-lg font-bold tracking-tight">{formatIDR(plan.price)}</div>
                                <div className="text-xs text-muted-foreground">per bulan</div>
                            </div>
                            <DropdownMenu>
                                {/* @ts-expect-error React 19 typing conflict with Radix */}
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditPlan(plan)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => setDeletePlan(plan)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                )}
            </div>

            {/* Table (desktop) */}
            <div className="hidden rounded-lg border bg-card overflow-x-auto md:block">
                <Table className="min-w-[450px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Paket</TableHead>
                            <TableHead>Kecepatan</TableHead>
                            <TableHead>Harga / Bulan</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : plans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Belum ada paket.
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {plan.speedMbps} Mbps
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold">{formatIDR(plan.price)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            {/* @ts-expect-error React 19 typing conflict with Radix */}
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditPlan(plan)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setDeletePlan(plan)}
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
                open={!!editPlan}
                onOpenChange={(open) => !open && setEditPlan(null)}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Edit Paket</DialogTitle>
                        <DialogDescription>Perbarui detail paket.</DialogDescription>
                    </DialogHeader>
                    {editPlan && <PlanForm onSubmit={handleEdit} defaults={editPlan} />}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deletePlan}
                onOpenChange={(open) => !open && setDeletePlan(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Paket?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus paket <strong>{deletePlan?.name}</strong>? Pelanggan yang menggunakan paket ini mungkin terpengaruh.
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

function PlanForm({
    onSubmit,
    defaults,
}: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    defaults?: Plan;
}) {
    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nama Paket</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={defaults?.name}
                        placeholder="e.g. Basic"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="speedMbps">Kecepatan (Mbps)</Label>
                    <Input
                        id="speedMbps"
                        name="speedMbps"
                        type="number"
                        defaultValue={defaults?.speedMbps}
                        placeholder="5"
                        min={1}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="price">Harga / Bulan (Rp)</Label>
                    <Input
                        id="price"
                        name="price"
                        type="number"
                        defaultValue={defaults?.price}
                        placeholder="120000"
                        min={0}
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
