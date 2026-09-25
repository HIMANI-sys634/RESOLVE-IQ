"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Customer } from "@/lib/types";
import { EmptyState } from "@/components/ui/States";
import { formatRelativeTime } from "@/lib/utils";

const TIER_LABEL: Record<Customer["tier"], string> = {
  standard: "Standard",
  priority: "Priority",
  enterprise: "Enterprise",
};

export function CustomerTable({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.trim().toLowerCase();
    return customers.filter(
      (c) => c.id.toLowerCase().includes(q) || c.displayName.toLowerCase().includes(q) || c.region.toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 sm:w-72">
        <Search size={14} strokeWidth={2} className="text-text-tertiary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID or region"
          className="w-full bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No customers match this search" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-bg-raised text-[12px] text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Tier</th>
                <th className="px-4 py-2.5 font-medium">Region</th>
                <th className="px-4 py-2.5 font-medium">Orders</th>
                <th className="px-4 py-2.5 font-medium">Tickets</th>
                <th className="px-4 py-2.5 font-medium">Last contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-b-0 transition-colors duration-150 hover:bg-panel">
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-text-primary">{c.displayName}</p>
                    <p className="mt-0.5 text-[12px] text-text-tertiary">{c.id}</p>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary">{TIER_LABEL[c.tier]}</td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary">{c.region}</td>
                  <td className="px-4 py-3 text-[12px] tabular-nums text-text-secondary">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-[12px] tabular-nums text-text-secondary">{c.totalTickets}</td>
                  <td className="px-4 py-3 text-[12px] tabular-nums text-text-tertiary">{formatRelativeTime(c.lastContact)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
