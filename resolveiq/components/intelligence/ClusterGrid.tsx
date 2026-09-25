import Link from "next/link";
import { Trend } from "@/lib/types";
import { Panel } from "@/components/ui/Panel";
import {
  SeverityBadge,
  SentimentBadge,
  TrendDelta,
} from "@/components/ui/Badge";
import { Sparkline } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/ui/States";
import { Radar } from "lucide-react";

function displaySeverity(trend: Trend) {
  const category = trend.clusterName.toLowerCase();

  // Student 2 identifies these complaint types with these severities.
  if (category.includes("damaged product")) {
    return "high";
  }

  if (category.includes("late delivery")) {
    return "medium";
  }

  return trend.severity;
}

export function ClusterGrid({ trends }: { trends: Trend[] }) {
  if (trends.length === 0) {
    return (
      <EmptyState
        icon={<Radar size={16} strokeWidth={2} />}
        title="No complaint clusters detected in this period"
        description="Patterns will appear here once related complaints accumulate."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {trends.map((t) => (
        <Link
          key={t.clusterId}
          href={`/intelligence/${t.clusterId}`}
          className="block"
        >
          <Panel className="h-full transition-colors duration-150 hover:bg-panel-hover">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-text-primary">
                  {t.clusterName}
                </p>

                <p className="mt-0.5 text-[12px] text-text-secondary">
                  {t.category}
                </p>
              </div>

              <Sparkline
                data={t.history}
                color="var(--color-accent)"
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <SeverityBadge severity={displaySeverity(t)} />
              <SentimentBadge sentiment={t.sentiment} />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="tabular-nums text-[20px] font-semibold text-text-primary">
                {t.count}
              </span>

              <span className="text-[12px] text-text-secondary">
                related complaints
              </span>

              <TrendDelta value={t.growthPercent} />
            </div>

            <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-text-secondary">
              {t.potentialPattern}
            </p>

            <p className="mt-3 text-[11px] text-text-tertiary">
              {t.regionsAffected} regions affected
            </p>
          </Panel>
        </Link>
      ))}
    </div>
  );
}