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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Send, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthYearFilter } from "@/components/MonthYearFilter";
import { toast } from "sonner";
import { formatIDR } from "@/lib/formatCurrency";

export default function RemindersPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
    const [year, setYear] = useState(new Date().getFullYear() + "");
    const [reminderTemplate, setReminderTemplate] = useState("");
    const [receiptTemplate, setReceiptTemplate] = useState("");
    const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetch("/api/reminder-templates")
            .then(res => res.json())
            .then(data => {
                setReminderTemplate(data.reminder || "");
                setReceiptTemplate(data.receipt || "");
            });
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/invoices?month=${month}&year=${year}`)
            .then(res => res.json())
            .then(data => {
                setOverdueInvoices(data.filter((inv: any) => inv.status === "overdue"));
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [month, year]);

    const handleSaveTemplates = async () => {
        setIsSaving(true);
        try {
            await fetch("/api/reminder-templates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reminder: reminderTemplate,
                    receipt: receiptTemplate
                })
            });
            toast.success("Template berhasil disimpan!");
        } catch (e) {
            toast.error("Gagal menyimpan template");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendReminder = (inv: any) => {
        const message = reminderTemplate
            .replace("{{nama}}", inv.customer?.name || "")
            .replace("{{total}}", formatIDR(inv.total))
            .replace("{{bulan}}", `${month}/${year}`);

        const w = inv.customer?.whatsapp || "";
        const waUrl = `https://wa.me/${w.replace(/^0/, "62")}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
        toast.success(`Membuka WhatsApp untuk ${inv.customer?.name}…`);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pengingat</h1>
                        {!isLoading && overdueInvoices.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                                {overdueInvoices.length} overdue
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Kirim pengingat tagihan overdue ke pelanggan via WhatsApp.
                    </p>
                </div>
                <MonthYearFilter
                    month={month}
                    year={year}
                    onMonthChange={setMonth}
                    onYearChange={setYear}
                />
            </div>

            {/* Overdue List */}
            <div className="rounded-lg border bg-card overflow-x-auto">
                <Table className="min-w-[650px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Invoice</TableHead>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Jatuh Tempo</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : overdueInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Tidak ada invoice overdue. 🎉
                                </TableCell>
                            </TableRow>
                        ) : (
                            overdueInvoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium font-mono text-xs">{inv.invoiceNumber}</TableCell>
                                    <TableCell>{inv.customer?.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{inv.customer?.whatsapp}</TableCell>
                                    <TableCell className="font-semibold">{formatIDR(inv.total)}</TableCell>
                                    <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => handleSendReminder(inv)}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <Send className="mr-1.5 h-3.5 w-3.5" />
                                            Kirim WA
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Templates */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Template Pesan</h2>
                <Button onClick={handleSaveTemplates} disabled={isSaving} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Menyimpan..." : "Simpan Template"}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Template Pengingat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Label htmlFor="reminder-tpl" className="sr-only">
                            Template Pengingat
                        </Label>
                        <Textarea
                            id="reminder-tpl"
                            className="min-h-[180px] resize-none"
                            value={reminderTemplate}
                            onChange={(e) => setReminderTemplate(e.target.value)}
                            placeholder="Masukkan template pengingat..."
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Placeholder: {"{{nama}}"}, {"{{total}}"}, {"{{bulan}}"}
                            </p>
                            <span className="text-xs text-muted-foreground/60">
                                {reminderTemplate.length} karakter
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Template Struk Bayar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Label htmlFor="receipt-tpl" className="sr-only">
                            Template Struk
                        </Label>
                        <Textarea
                            id="receipt-tpl"
                            className="min-h-[180px] resize-none"
                            value={receiptTemplate}
                            onChange={(e) => setReceiptTemplate(e.target.value)}
                            placeholder="Masukkan template struk..."
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Placeholder: {"{{nama}}"}, {"{{total}}"}, {"{{bulan}}"}
                            </p>
                            <span className="text-xs text-muted-foreground/60">
                                {receiptTemplate.length} karakter
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
