"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Radar,
  Users,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Inbox },
  { href: "/intelligence", label: "Complaint Intelligence", icon: Radar },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/history", label: "Case History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-bg-raised md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-[13px] font-semibold text-accent-strong">
          R
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-text-primary">
          ResolveIQ
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                active
                  ? "bg-panel text-text-primary"
                  : "text-text-secondary hover:bg-panel hover:text-text-primary"
              )}
            >
              <Icon
                size={16}
                strokeWidth={2}
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  active ? "text-accent-strong" : "text-text-tertiary group-hover:text-text-secondary"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-text-tertiary">
          Team K-DON<br />Customer Support track
        </p>
      </div>
    </aside>
  );
}
