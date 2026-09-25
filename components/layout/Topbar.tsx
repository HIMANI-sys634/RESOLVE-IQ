"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

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

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const title = resolveTitle(pathname);

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !query.trim()) return;
    const q = query.trim();
    // A ticket ID goes straight to the ticket; anything else searches the
    // ticket list, which is where "search" means something concrete today.
    if (/^TK-\d+$/i.test(q)) {
      router.push(`/tickets/${q.toUpperCase()}`);
    } else {
      router.push(`/tickets?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-bg/95 px-6 backdrop-blur">
      <h1 className="text-[14px] font-semibold text-text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 text-text-tertiary transition-colors duration-150 focus-within:border-border-strong sm:flex">
          <Search size={14} strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Jump to a ticket ID or search tickets"
            className="w-64 bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>
        <div
          aria-label="Signed in as support operations user"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-hover text-[12px] font-semibold text-text-secondary"
        >
          KR
        </div>
      </div>
    </header>
  );
}
