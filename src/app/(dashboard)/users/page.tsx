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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, ShieldCheck, User as UserIcon, Fingerprint, CheckCircle2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
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

interface Admin {
    id: number;
    username: string;
    createdAt: string;
}

export default function UsersPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
    const [passkeyRegistered, setPasskeyRegistered] = useState(false);
    const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
    const [deleteAdmin, setDeleteAdmin] = useState<Admin | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admins");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setAdmins(data);
        } catch (error) {
            toast.error("Gagal memuat data pengguna");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const username = fd.get("username") as string;
        const password = fd.get("password") as string;

        try {
            const res = await fetch("/api/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal");

            await fetchAdmins();
            setIsAddOpen(false);
            toast.success("Pengguna berhasil ditambahkan!");
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan");
        }
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editAdmin) return;
        const fd = new FormData(e.currentTarget);
        const username = fd.get("username") as string;
        const password = fd.get("password") as string;

        try {
            const res = await fetch(`/api/admins/${editAdmin.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password: password || undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal");

            await fetchAdmins();
            setEditAdmin(null);
            toast.success("Pengguna berhasil diperbarui!");
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan");
        }
    };

    const handleDelete = async () => {
        if (!deleteAdmin) return;
        try {
            const res = await fetch(`/api/admins/${deleteAdmin.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal");

            await fetchAdmins();
            setDeleteAdmin(null);
            toast.success("Pengguna berhasil dihapus!");
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan");
        }
    };

    const handleRegisterPasskey = async () => {
        setIsRegisteringPasskey(true);
        try {
            const optRes = await fetch("/api/auth/webauthn/register-options", { method: "POST" });
            if (!optRes.ok) throw new Error("Gagal mendapatkan opsi pendaftaran");
            const options = await optRes.json();

            const credential = await startRegistration({ optionsJSON: options });

            const verRes = await fetch("/api/auth/webauthn/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credential),
            });

            if (!verRes.ok) throw new Error("Pendaftaran gagal");

            setPasskeyRegistered(true);
            toast.success("Sidik jari berhasil didaftarkan! Sekarang Anda bisa login tanpa password.");
        } catch (err: unknown) {
            if (err instanceof Error && err.name === "NotAllowedError") {
                toast.error("Pendaftaran dibatalkan.");
            } else {
                toast.error(err instanceof Error ? err.message : "Gagal mendaftarkan sidik jari");
            }
        } finally {
            setIsRegisteringPasskey(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pengaturan Pengguna</h1>
                        {!isLoading && (
                            <Badge variant="secondary" className="text-xs font-normal">
                                {admins.length} user
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Kelola akun operator sistem dan hak akses.
                    </p>
                </div>

                <Button
                    variant="outline"
                    className="gap-2 shrink-0"
                    onClick={handleRegisterPasskey}
                    disabled={isRegisteringPasskey || passkeyRegistered}
                >
                    {passkeyRegistered ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : isRegisteringPasskey ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Fingerprint className="h-4 w-4" />
                    )}
                    {passkeyRegistered ? "Sidik Jari Terdaftar" : "Daftarkan Sidik Jari"}
                </Button>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    {/* @ts-expect-error React 19 typing conflict with Radix */}
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Tambah User Baru</DialogTitle>
                            <DialogDescription>Masukkan username dan password untuk login.</DialogDescription>
                        </DialogHeader>
                        <AdminForm onSubmit={handleAdd} isNew />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Mobile card list */}
            <div className="flex flex-col gap-2.5 md:hidden">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    ))
                ) : admins.length === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                        Belum ada user.
                    </div>
                ) : (
                    admins.map((admin) => (
                        <div key={admin.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UserIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold">{admin.username}</div>
                                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <ShieldCheck className="h-3 w-3" />
                                    Administrator
                                </div>
                            </div>
                            <DropdownMenu>
                                {/* @ts-expect-error React 19 typing conflict with Radix */}
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                    <DropdownMenuItem onClick={() => setEditAdmin(admin)} className="cursor-pointer">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                                        onClick={() => setDeleteAdmin(admin)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                )}
            </div>

            {/* Table (desktop) */}
            <div className="hidden rounded-lg border bg-card overflow-x-auto shadow-sm md:block">
                <Table className="min-w-[450px]">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[300px]">Username</TableHead>
                            <TableHead>Dibuat Pada</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : admins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    Belum ada user.
                                </TableCell>
                            </TableRow>
                        ) : (
                            admins.map((admin) => (
                                <TableRow key={admin.id} className="group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <UserIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{admin.username}</span>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Administrator
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(admin.createdAt).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            {/* @ts-expect-error React 19 typing conflict with Radix */}
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:bg-secondary/80">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuItem onClick={() => setEditAdmin(admin)} className="cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                                                    onClick={() => setDeleteAdmin(admin)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Hapus User
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
                open={!!editAdmin}
                onOpenChange={(open) => !open && setEditAdmin(null)}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Perbarui username atau ganti password.</DialogDescription>
                    </DialogHeader>
                    {editAdmin && <AdminForm onSubmit={handleEdit} defaults={editAdmin} />}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteAdmin}
                onOpenChange={(open) => !open && setDeleteAdmin(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus user <strong>{deleteAdmin?.username}</strong>? Tindakan ini tidak dapat dibatalkan.
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

function AdminForm({
    onSubmit,
    defaults,
    isNew = false,
}: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    defaults?: Admin;
    isNew?: boolean;
}) {
    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        name="username"
                        defaultValue={defaults?.username}
                        placeholder="e.g. admin_baru"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">
                        {isNew ? "Password" : "Password Baru (kosongkan jika tidak ingin ganti)"}
                    </Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required={isNew}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto">Simpan</Button>
            </DialogFooter>
        </form>
    );
}
