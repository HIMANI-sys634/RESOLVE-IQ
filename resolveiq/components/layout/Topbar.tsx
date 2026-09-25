"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, Settings, LogOut } from "lucide-react";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/tickets": "Tickets",
  "/intelligence": "Complaint Intelligence",
  "/customers": "Customers",
  "/history": "Case History",
  "/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/tickets/")) return "Ticket investigation";
  if (pathname.startsWith("/intelligence/")) return "Issue detail";
  return "ResolveIQ";
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const title = resolveTitle(pathname);

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !query.trim()) return;

    const q = query.trim();

    if (/^(TK-\d+|C[A-Z0-9]+)$/i.test(q)) {
      router.push(`/tickets/${q.toUpperCase()}`);
    } else {
      router.push(`/tickets?q=${encodeURIComponent(q)}`);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="-ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 hover:bg-panel hover:text-text-primary md:hidden"
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        <h1 className="truncate text-[14px] font-semibold text-text-primary">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 text-text-tertiary transition-colors duration-150 focus-within:border-border-strong sm:flex">
          <Search size={14} strokeWidth={2} />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Jump to a case ID or search tickets"
            className="w-64 bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <button
          onClick={() => router.push("/tickets")}
          aria-label="Search tickets"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-panel text-text-tertiary transition-colors duration-150 hover:text-text-primary sm:hidden"
        >
          <Search size={14} strokeWidth={2} />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-hover text-[12px] font-semibold text-text-secondary transition-colors duration-150 hover:bg-panel hover:text-text-primary"
          >
            MJ
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-lg border border-border bg-panel shadow-xl">
              <div className="border-b border-border px-4 py-3">
                <p className="text-[13px] font-semibold text-text-primary">
                  Support Operations
                </p>

                <p className="mt-0.5 text-[11px] text-text-tertiary">
                  Admin
                </p>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/settings");
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[12px] text-text-secondary transition-colors hover:bg-panel-hover hover:text-text-primary"
              >
                <Settings size={15} />
                Settings
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left text-[12px] text-text-secondary transition-colors hover:bg-panel-hover hover:text-text-primary"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}