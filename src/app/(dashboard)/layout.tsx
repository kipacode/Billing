"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 pb-24 md:pb-6 animate-in fade-in duration-300">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
