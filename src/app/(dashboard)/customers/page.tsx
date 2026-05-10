"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Search, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatIDR } from "@/lib/formatCurrency";

interface Customer {
    id: number;
    name: string;
    address: string;
    area: number;
    whatsapp: string;
    planId: number;
    plan?: { name: string; speedMbps: number; price: number };
    discount: number;
    status: "active" | "suspended";
    registrationDate: string;
}

interface Plan {
    id: number;
    name: string;
    speedMbps: number;
    price: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [search, setSearch] = useState("");
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
    const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer & { invoices?: any[] } | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [custRes, plansRes] = await Promise.all([
                fetch("/api/customers"),
                fetch("/api/plans"),
            ]);
            setCustomers(await custRes.json());
            setPlans(await plansRes.json());
        } catch (error) {
            toast.error("Gagal memuat data pelanggan");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filtered = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.whatsapp.includes(search)
    );

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const newCustomer = {
            name: fd.get("name") as string,
            address: fd.get("address") as string,
            area: Number(fd.get("area")),
            whatsapp: fd.get("whatsapp") as string,
            planId: Number(fd.get("planId")),
            discount: Number(fd.get("discount")) || 0,
            status: (fd.get("status") as "active" | "suspended") || "active",
            registrationDate: fd.get("registrationDate") as string,
        };

        try {
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCustomer),
            });
            if (!res.ok) throw new Error("Gagal menambah");

            await fetchData();
            setIsAddOpen(false);
            setDuplicateCustomer(null);
            toast.success("Pelanggan berhasil ditambahkan!");
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editCustomer) return;
        const fd = new FormData(e.currentTarget);
        const updated = {
            name: fd.get("name") as string,
            address: fd.get("address") as string,
            area: Number(fd.get("area")),
            whatsapp: fd.get("whatsapp") as string,
            planId: Number(fd.get("planId")),
            discount: Number(fd.get("discount")) || 0,
            status: (fd.get("status") as "active" | "suspended") || editCustomer.status,
            registrationDate: fd.get("registrationDate") as string,
        };

        try {
            const res = await fetch(`/api/customers/${editCustomer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            if (!res.ok) throw new Error("Gagal mengubah");

            await fetchData();
            setEditCustomer(null);
            toast.success("Pelanggan berhasil diperbarui!");
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleDelete = async () => {
        if (!deleteCustomer) return;
        try {
            const res = await fetch(`/api/customers/${deleteCustomer.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal menghapus");

            await fetchData();
            setDeleteCustomer(null);
            toast.success("Pelanggan berhasil dihapus!");
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleRowClick = async (customer: Customer) => {
        setIsDetailLoading(true);
        setSelectedCustomer({ ...customer, invoices: [] } as any);
        try {
            const res = await fetch(`/api/customers/${customer.id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedCustomer(data);
            }
        } catch (error) {
            toast.error("Gagal memuat detail pelanggan");
        } finally {
            setIsDetailLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pelanggan</h1>
                        {!isLoading && (
                            <Badge variant="secondary" className="text-xs font-normal">
                                {customers.length} total
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Kelola data pelanggan jaringan internet.
                    </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    {/* @ts-expect-error React 19 typing conflict with Radix */}
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Pelanggan
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                            <DialogDescription>
                                Isi data untuk mendaftarkan pelanggan baru.
                            </DialogDescription>
                        </DialogHeader>
                        <CustomerForm onSubmit={handleAdd} plans={plans} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2 w-full sm:max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari pelanggan..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-lg border bg-card overflow-x-auto">
                <Table className="min-w-[700px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>Area / Paket</TableHead>
                            <TableHead>Diskon</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div></TableCell>
                                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                                    <TableCell><div className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-24" /></div></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Tidak ada pelanggan ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((customer) => (
                                <TableRow 
                                    key={customer.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleRowClick(customer)}
                                >
                                    <TableCell>
                                        <div className="font-medium">{customer.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {customer.whatsapp}
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        className="max-w-[200px] truncate"
                                        title={customer.address}
                                    >
                                        {customer.address}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">Area {customer.area}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {customer.plan?.name} {customer.plan && `${customer.plan.speedMbps}Mbps`}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {customer.discount > 0
                                            ? formatIDR(customer.discount)
                                            : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                customer.status === "active" ? "default" : "destructive"
                                            }
                                        >
                                            {customer.status === "active" ? "Active" : "Suspended"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                {/* @ts-expect-error React 19 typing conflict with Radix */}
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => setEditCustomer(customer)}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDuplicateCustomer(customer)}
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Duplikat
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteCustomer(customer)}
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

            {/* Detail Dialog */}
            <Dialog
                open={!!selectedCustomer}
                onOpenChange={(open) => !open && setSelectedCustomer(null)}
            >
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Pelanggan</DialogTitle>
                        <DialogDescription>
                            Informasi pelanggan dan riwayat tagihan {new Date().getFullYear()}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCustomer && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium text-muted-foreground">Nama</p>
                                    <p className="font-semibold">{selectedCustomer.name}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-muted-foreground">Status</p>
                                    <Badge variant={selectedCustomer.status === "active" ? "default" : "destructive"} className="mt-1">
                                        {selectedCustomer.status === "active" ? "Active" : "Suspended"}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="font-medium text-muted-foreground">No. WhatsApp</p>
                                    <p>{selectedCustomer.whatsapp}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-muted-foreground">Area & Paket</p>
                                    <p>Area {selectedCustomer.area} - {selectedCustomer.plan?.name} ({selectedCustomer.plan?.speedMbps}Mbps)</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-medium text-muted-foreground">Alamat</p>
                                    <p>{selectedCustomer.address}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-muted-foreground">Biaya Bulanan</p>
                                    <p>{formatIDR(selectedCustomer.plan?.price || 0)} {selectedCustomer.discount > 0 && <span className="text-emerald-600">(Diskon {formatIDR(selectedCustomer.discount)})</span>}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-muted-foreground">Tanggal Registrasi</p>
                                    <p>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(selectedCustomer.registrationDate))}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-3">Riwayat Tagihan {new Date().getFullYear()}</h4>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Bulan</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Tgl Bayar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isDetailLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Memuat tagihan...</TableCell>
                                                </TableRow>
                                            ) : selectedCustomer.invoices?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Tidak ada tagihan tahun ini.</TableCell>
                                                </TableRow>
                                            ) : (
                                                selectedCustomer.invoices?.map((inv: any) => (
                                                    <TableRow key={inv.id}>
                                                        <TableCell>
                                                            {new Date(inv.billingYear, inv.billingMonth - 1).toLocaleString('id-ID', { month: 'long' })}
                                                        </TableCell>
                                                        <TableCell>{formatIDR(inv.total)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={inv.status === "paid" ? "secondary" : inv.status === "overdue" ? "destructive" : "default"} className="text-[10px] sm:text-xs">
                                                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {inv.paidDate ? new Intl.DateTimeFormat('id-ID').format(new Date(inv.paidDate)) : "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Duplicate Dialog */}
            <Dialog
                open={!!duplicateCustomer}
                onOpenChange={(open) => !open && setDuplicateCustomer(null)}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Duplikat Pelanggan</DialogTitle>
                        <DialogDescription>
                            Buat pelanggan baru menggunakan data dari <strong>{duplicateCustomer?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    {duplicateCustomer && (
                        <CustomerForm 
                            onSubmit={handleAdd} 
                            defaults={{...duplicateCustomer, name: `${duplicateCustomer.name} (Copy)`}} 
                            plans={plans} 
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={!!editCustomer}
                onOpenChange={(open) => !open && setEditCustomer(null)}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Pelanggan</DialogTitle>
                        <DialogDescription>Perbarui data pelanggan.</DialogDescription>
                    </DialogHeader>
                    {editCustomer && (
                        <CustomerForm onSubmit={handleEdit} defaults={editCustomer} plans={plans} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteCustomer}
                onOpenChange={(open) => !open && setDeleteCustomer(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus <strong>{deleteCustomer?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

/* ─── Shared Form ─── */
function CustomerForm({
    onSubmit,
    defaults,
    plans,
}: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    defaults?: Customer;
    plans: Plan[];
}) {
    const formattedDate = defaults?.registrationDate
        ? new Date(defaults.registrationDate).toISOString().split('T')[0]
        : "";
    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nama Pelanggan</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={defaults?.name}
                        placeholder="Nama lengkap"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="address">Alamat Instalasi</Label>
                    <Input
                        id="address"
                        name="address"
                        defaultValue={defaults?.address}
                        placeholder="Jl. Example No. 123"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="area">Area (1-8)</Label>
                        <Select
                            name="area"
                            defaultValue={defaults?.area?.toString() || "1"}
                        >
                            <SelectTrigger id="area">
                                <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                    <SelectItem key={n} value={n.toString()}>
                                        Area {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="planId">Paket</Label>
                        <Select
                            name="planId"
                            defaultValue={defaults?.planId?.toString() || (plans[0]?.id.toString() ?? "")}
                        >
                            <SelectTrigger id="planId">
                                <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name} {p.speedMbps}Mbps
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="whatsapp">No. WhatsApp</Label>
                        <Input
                            id="whatsapp"
                            name="whatsapp"
                            defaultValue={defaults?.whatsapp}
                            placeholder="081xxx"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="discount">Diskon (Rp)</Label>
                        <Input
                            id="discount"
                            name="discount"
                            type="number"
                            defaultValue={defaults?.discount || 0}
                            min={0}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="registrationDate">Tanggal Registrasi</Label>
                        <Input
                            id="registrationDate"
                            name="registrationDate"
                            type="date"
                            defaultValue={formattedDate}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            name="status"
                            defaultValue={defaults?.status || "active"}
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button type="submit">Simpan</Button>
            </DialogFooter>
        </form>
    );
}
