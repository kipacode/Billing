"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Banknote, FileText, AlertTriangle } from "lucide-react";
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
}

const METRIC_CARDS = [
    {
        key: "activeCustomers",
        label: "Active Customers",
        href: "/customers",
        icon: Users,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-600",
        subtitle: "Total pelanggan aktif",
        format: (v: number) => v.toString(),
    },
    {
        key: "revenue",
        label: "Total Revenue",
        href: "/reports",
        icon: Banknote,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-600",
        subtitle: "Dari invoice lunas",
        format: (v: number) => formatIDR(v),
    },
    {
        key: "pendingInvoices",
        label: "Pending Invoices",
        href: "/invoices",
        icon: FileText,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-600",
        subtitle: "Belum dibayar",
        format: (v: number) => v.toString(),
    },
    {
        key: "overdueInvoices",
        label: "Overdue Invoices",
        href: "/reminders",
        icon: AlertTriangle,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-600",
        subtitle: "Segera kirim pengingat",
        format: (v: number) => v.toString(),
    },
];

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Ringkasan iuran dan pelanggan bulan ini.
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
                    <Link
                        key={metric.key}
                        href={metric.href}
                        className="rounded-xl transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <Card className="card-hover h-full cursor-pointer">
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
                    </Link>
                ))}
            </div>

        </div>
    );
}
