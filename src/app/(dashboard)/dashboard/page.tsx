"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Banknote, FileText, AlertTriangle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthYearFilter } from "@/components/MonthYearFilter";
import { formatIDR } from "@/lib/formatCurrency";

interface DashboardData {
    revenue: number;
    activeCustomers: number;
    pendingInvoices: number;
    overdueInvoices: number;
    operationals: number;
    profit: number;
    overdueList: any[];
}

const METRIC_CARDS = [
    {
        key: "activeCustomers",
        label: "Active Customers",
        icon: Users,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-600",
        subtitle: "Total pelanggan aktif",
        format: (v: number) => v.toString(),
    },
    {
        key: "revenue",
        label: "Total Revenue",
        icon: Banknote,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-600",
        subtitle: "Dari invoice lunas",
        format: (v: number) => formatIDR(v),
    },
    {
        key: "pendingInvoices",
        label: "Pending Invoices",
        icon: FileText,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-600",
        subtitle: "Belum dibayar",
        format: (v: number) => v.toString(),
    },
    {
        key: "overdueInvoices",
        label: "Overdue Invoices",
        icon: AlertTriangle,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-600",
        subtitle: "Segera kirim pengingat",
        format: (v: number) => v.toString(),
    },
];

export default function DashboardPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/dashboard?month=${month}&year=${year}`)
            .then((res) => res.json())
            .then((json) => {
                setData(json);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch dashboard:", err);
                setIsLoading(false);
            });
    }, [month, year]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Ringkasan tagihan dan pelanggan bulan ini.
                    </p>
                </div>
                <MonthYearFilter
                    month={month}
                    year={year}
                    onMonthChange={setMonth}
                    onYearChange={setYear}
                />
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
                {METRIC_CARDS.map((metric) => (
                    <Card key={metric.key} className="card-hover">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {metric.label}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${metric.iconBg}`}>
                                <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-24 mb-1" />
                            ) : (
                                <div className="text-2xl font-bold">
                                    {metric.format((data as any)?.[metric.key] || 0)}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                {metric.subtitle}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Overdue Invoices Table */}
            <div className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">
                        Invoice Overdue
                    </h2>
                    {!isLoading && data?.overdueList && (
                        <Badge variant="destructive" className="text-xs">
                            {data.overdueList.length} overdue
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
                                <TableHead>Jatuh Tempo</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : data?.overdueList?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Tidak ada invoice overdue. 🎉
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.overdueList?.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium font-mono text-xs">{inv.invoiceNumber}</TableCell>
                                        <TableCell>{inv.customer?.name}</TableCell>
                                        <TableCell className="font-semibold">{formatIDR(inv.total)}</TableCell>
                                        <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="destructive">Overdue</Badge>
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
