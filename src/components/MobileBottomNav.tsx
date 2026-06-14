"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    FileText,
    Wrench,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
    { name: "Beranda", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pelanggan", href: "/customers", icon: Users },
    { name: "Invoice", href: "/invoices", icon: FileText },
    { name: "Operasional", href: "/operationals", icon: Wrench },
    { name: "Laporan", href: "/reports", icon: BarChart3 },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
            aria-label="Navigasi utama"
        >
            <div className="grid grid-cols-5">
                {items.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span
                                className={cn(
                                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                                    isActive && "bg-primary/10"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                            </span>
                            <span className="leading-none">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
