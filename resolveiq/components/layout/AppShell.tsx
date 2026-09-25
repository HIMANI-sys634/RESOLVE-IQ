"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="md:pl-60">
        <Topbar onMenuClick={() => setNavOpen(true)} />

        <main
          key={pathname}
          className="animate-fade-in-up px-4 py-6 sm:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}