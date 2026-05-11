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
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetch(`/api/dashboard?month=${month}&year=${year}`).then(res => res.json()),
            fetch(`/api/reports/transactions?month=${month}&year=${year}`).then(res => res.json())
        ])
            .then(([dashboardData, transactionData]) => {
                setMetrics(dashboardData);
                setTransactions(transactionData);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
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
                            Paid Operational
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
                        <p className="text-xs text-muted-foreground mt-1">Pengeluaran lunas bulan ini</p>
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
                            Revenue − Paid Operasional
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Detail Transaksi</h2>
                    {!isLoading && (
                        <Badge variant="secondary" className="text-xs">
                            {transactions.length} transaksi
                        </Badge>
                    )}
                </div>
                <div className="rounded-lg border bg-card overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead>Referensi</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Tidak ada transaksi untuk periode ini.</TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-sm">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{tx.description}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{tx.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">{tx.reference}</TableCell>
                                        <TableCell className={`text-right font-semibold ${tx.type === "revenue" ? "text-emerald-600" : "text-red-600"}`}>
                                            {tx.type === "revenue" ? "+" : ""}{formatIDR(tx.amount)}
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
