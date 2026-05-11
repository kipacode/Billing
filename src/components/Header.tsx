"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "@/components/Sidebar";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/customers": "Pelanggan",
    "/plans": "Paket Layanan",
    "/invoices": "Invoice",
    "/operationals": "Operasional",
    "/reports": "Laporan",
    "/reminders": "Pengingat",
};

export function Header() {
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname] || "ANFIELDNET Billing";
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                {/* Mobile hamburger */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-muted-foreground"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>

                <div className="flex-1">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        {title}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                        <span className="sr-only">Notifications</span>
                    </Button>
                </div>
            </header>

            {/* Mobile sidebar sheet */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex h-full flex-col px-4 py-6">
                        <SidebarContent onNavigate={() => setMobileOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
