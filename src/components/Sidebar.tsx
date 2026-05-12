"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    FileText,
    Package,
    Wrench,
    BarChart3,
    BellRing,
    Wifi,
    LogOut,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pelanggan", href: "/customers", icon: Users },
    { name: "Paket", href: "/plans", icon: Package },
    { name: "Invoice", href: "/invoices", icon: FileText },
    { name: "Operasional", href: "/operationals", icon: Wrench },
    { name: "Laporan", href: "/reports", icon: BarChart3 },
    { name: "Pengingat", href: "/reminders", icon: BellRing },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <>
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-2 mb-8">
                <div className="flex bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-2 rounded-xl shadow-sm">
                    <Wifi className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold tracking-tight leading-tight">ANFIELDNET</span>
                    <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Billing System</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Menu
                </p>
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                            )}
                        >
                            {/* Active indicator bar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary animate-fade-in" />
                            )}
                            <item.icon className={cn(
                                "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                                isActive && "text-primary"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div className="mt-auto pt-4 border-t">
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-primary/10">
                            AD
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Admin</span>
                            <span className="text-[11px] text-muted-foreground">
                                System Operator
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/users"
                                    className="p-2 text-muted-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-primary/10"
                                >
                                    <Settings className="h-4 w-4" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">Settings</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-muted-foreground hover:text-destructive transition-all duration-200 rounded-lg hover:bg-destructive/10"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Logout</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </>
    );
}

export function Sidebar() {
    return (
        <div className="hidden md:flex h-full w-64 flex-col border-r bg-card px-4 py-6">
            <SidebarContent />
        </div>
    );
}
