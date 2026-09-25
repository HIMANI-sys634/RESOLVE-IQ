"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />
        <main
          key={pathname}
          className="animate-fade-in-up px-6 py-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
