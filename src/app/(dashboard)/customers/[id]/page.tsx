import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatIDR } from "@/lib/formatCurrency";
import { Badge } from "@/components/ui/badge";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CustomerDetailPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const { id } = await params;
    const currentYear = new Date().getFullYear();

    const customer = await prisma.customer.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
            plan: true,
            invoices: {
                where: { billingYear: currentYear },
                orderBy: { billingMonth: "desc" },
            },
        },
    });

    if (!customer) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                {/* @ts-expect-error React 19 typing conflict with Radix */}
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/customers">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Detail Pelanggan</h1>
                    <p className="text-muted-foreground">
                        Informasi pelanggan dan riwayat iuran tahun {currentYear}.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Utama</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Nama</p>
                                <p className="text-lg font-semibold">{customer.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <Badge variant={customer.status === "active" ? "default" : "destructive"} className="mt-1">
                                    {customer.status === "active" ? "Active" : "Suspended"}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">No. WhatsApp</p>
                                <p className="font-medium">{customer.whatsapp}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Area</p>
                                <p className="font-medium">Area {customer.area}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Alamat</p>
                                <p className="font-medium">{customer.address}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Layanan & Iuran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Paket Layanan</p>
                                <p className="font-medium">{customer.plan?.name} {customer.plan?.speedMbps}Mbps</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Biaya Bulanan</p>
                                <p className="font-medium">{formatIDR(customer.plan?.price || 0)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Diskon Tetap</p>
                                <p className="font-medium text-emerald-600">{formatIDR(customer.discount)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tanggal Registrasi</p>
                                <p className="font-medium">
                                    {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(customer.registrationDate))}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Iuran {currentYear}</CardTitle>
                    <CardDescription>Daftar invoice untuk tahun berjalan</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No. Invoice</TableHead>
                                <TableHead>Bulan</TableHead>
                                <TableHead>Total Iuran</TableHead>
                                <TableHead>Jatuh Tempo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal Bayar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customer.invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Tidak ada iuran ditemukan di tahun {currentYear}.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customer.invoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                                        <TableCell>
                                            {new Date(inv.billingYear, inv.billingMonth - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell>{formatIDR(inv.total)}</TableCell>
                                        <TableCell>
                                            {new Intl.DateTimeFormat('id-ID').format(new Date(inv.dueDate))}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={inv.status === "paid" ? "secondary" : inv.status === "overdue" ? "destructive" : "default"}>
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
                </CardContent>
            </Card>
        </div>
    );
}
