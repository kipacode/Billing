"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, TrendingDown, TrendingUp, Download } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthYearFilter } from "@/components/MonthYearFilter";
import { formatIDR } from "@/lib/formatCurrency";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
    paid: "default",
    unpaid: "secondary",
    overdue: "destructive",
};

export default function ReportsPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");
    const [metrics, setMetrics] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetch(`/api/dashboard?month=${month}&year=${year}`).then(res => res.json()),
            fetch(`/api/invoices?month=${month}&year=${year}`).then(res => res.json())
        ])
            .then(([dashboardData, invoiceData]) => {
                setMetrics(dashboardData);
                setInvoices(invoiceData);
                setIsLoading(false);
            })
            .catch(() => {
                toast.error("Gagal memuat laporan");
                setIsLoading(false);
            });
    }, [month, year]);

    const handleExport = () => {
        toast("Export sedang diproses… (placeholder)");
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Laporan</h1>
                    <p className="text-muted-foreground">
                        Ringkasan keuangan berdasarkan bulan dan tahun.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <MonthYearFilter
                        month={month}
                        year={year}
                        onMonthChange={setMonth}
                        onYearChange={setYear}
                    />
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 stagger-children">
                <Card className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Banknote className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-28" />
                        ) : (
                            <div className="text-2xl font-bold">{formatIDR(metrics?.revenue || 0)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Dari invoice lunas</p>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Operasional
                        </CardTitle>
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-28" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {formatIDR(metrics?.operationals || 0)}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Pengeluaran bulan ini</p>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-28" />
                        ) : (
                            <div
                                className={`text-2xl font-bold ${(metrics?.profit || 0) < 0 ? "text-destructive" : ""}`}
                            >
                                {formatIDR(metrics?.profit || 0)}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Revenue − Operasional
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice Table */}
            <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Detail Invoice</h2>
                    {!isLoading && (
                        <Badge variant="secondary" className="text-xs">
                            {invoices.length} invoice
                        </Badge>
                    )}
                </div>
                <div className="rounded-lg border bg-card overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>No. Invoice</TableHead>
                                <TableHead>Pelanggan</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Tgl. Bayar</TableHead>
                                <TableHead className="text-right">Status</TableHead>
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
                                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada invoice untuk periode ini.</TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium font-mono text-xs">{inv.invoiceNumber}</TableCell>
                                        <TableCell>{inv.customer?.name}</TableCell>
                                        <TableCell className="font-semibold">{formatIDR(inv.total)}</TableCell>
                                        <TableCell>{inv.payment?.paidDate ? new Date(inv.payment.paidDate).toLocaleDateString() : <span className="text-muted-foreground">-</span>}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={STATUS_VARIANT[inv.status] as any}>
                                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
