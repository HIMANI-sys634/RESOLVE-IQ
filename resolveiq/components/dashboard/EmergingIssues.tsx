import Link from "next/link";
import { ArrowUpRight, Radar } from "lucide-react";
import { Trend } from "@/lib/types";
import { SeverityBadge, TrendDelta } from "@/components/ui/Badge";
import { Sparkline } from "./charts";
import { EmptyState } from "@/components/ui/States";

/**
 * The dashboard's differentiating section. The headline states the actual
 * product claim in numbers — individual complaints connected into a shared
 * pattern — rather than leaving it implicit in a generic list.
 */
export function EmergingIssues({ trends }: { trends: Trend[] }) {
  const sorted = [...trends].sort((a, b) => b.growthPercent - a.growthPercent).slice(0, 4);
  const totalComplaints = trends.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="rounded-lg border border-accent-strong/25 bg-panel">
      <div className="flex flex-col gap-3 border-b border-accent-strong/20 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-accent-strong">
            Complaint intelligence
          </p>
          <p className="mt-1 text-[15px] font-semibold text-text-primary">
            <span className="tabular-nums">{totalComplaints}</span> individual complaints connected into{" "}
            <span className="tabular-nums">{trends.length}</span> known patterns
          </p>
        </div>
        <Link
          href="/intelligence"
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-accent-strong hover:underline"
        >
          View all patterns
          <ArrowUpRight size={13} strokeWidth={2} />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<Radar size={16} strokeWidth={2} />}
            title="No emerging issues detected in this period"
            description="Complaint clustering will surface a pattern here once related complaints accumulate."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((t) => (
            <li key={t.clusterId}>
              <Link
                href={`/intelligence/${t.clusterId}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-panel-hover sm:grid-cols-[1fr_auto_auto_96px] sm:gap-4 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-text-primary">{t.clusterName}</p>
                  <p className="mt-0.5 truncate text-[12px] text-text-secondary">
                    <span className="tabular-nums text-text-primary">{t.count}</span> complaints ·{" "}
                    {t.regionsAffected} regions
                  </p>
                </div>
                <SeverityBadge severity={t.severity} />
                <TrendDelta value={t.growthPercent} />
                <div className="hidden sm:block">
                  <Sparkline data={t.history} color="var(--color-accent)" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
