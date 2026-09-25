"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown } from "lucide-react";
import { Ticket, TicketStatus, Severity } from "@/lib/types";
import { SeverityBadge, StatusBadge, EscalationBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { formatRelativeTime } from "@/lib/utils";
import { getCustomerById } from "@/lib/mock-data";

type SortKey = "updatedAt" | "severity";

const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const STATUS_FILTERS: (TicketStatus | "all")[] = ["all", "open", "investigating", "escalated", "resolved"];

export function TicketTable({
  tickets,
  initialQuery = "",
}: {
  tickets: Ticket[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");

  const filtered = useMemo(() => {
    let result = tickets;
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (getCustomerById(t.customerId)?.displayName ?? t.customerId).toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sortKey === "severity") return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tickets, query, statusFilter, sortKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 sm:w-72">
          <Search size={14} strokeWidth={2} className="text-text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, subject, category, customer"
            className="w-full bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-border bg-panel p-0.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded px-2.5 py-1 text-[12px] font-medium capitalize transition-colors duration-150 ${
                  statusFilter === s
                    ? "bg-panel-hover text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortKey(sortKey === "updatedAt" ? "severity" : "updatedAt")}
            className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-2.5 py-1.5 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
          >
            <ArrowUpDown size={13} strokeWidth={2} />
            Sort: {sortKey === "updatedAt" ? "Recently updated" : "Severity"}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No tickets match these filters"
          description="Try a different search term or clear the status filter."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-bg-raised text-[12px] text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Ticket</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Severity</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Escalation</th>
                <th className="px-4 py-2.5 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const customer = getCustomerById(t.customerId);
                return (
                  <tr key={t.id} className="border-b border-border last:border-b-0 transition-colors duration-150 hover:bg-panel">
                    <td className="px-4 py-3">
                      <Link href={`/tickets/${t.id}`} className="block">
                        <span className="text-[13px] font-medium text-text-primary hover:underline">
                          {t.subject}
                        </span>
                        <p className="mt-0.5 text-[12px] text-text-tertiary">
                          {t.id} · {customer?.displayName ?? t.customerId}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-secondary">{t.category}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={t.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <EscalationBadge state={t.escalation} />
                    </td>
                    <td className="px-4 py-3 text-[12px] tabular-nums text-text-tertiary">
                      {formatRelativeTime(t.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
