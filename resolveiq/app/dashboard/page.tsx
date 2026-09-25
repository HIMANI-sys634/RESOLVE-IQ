import { fetchDashboardMetrics, fetchTrends } from "@/services/api";
import { MetricStrip } from "@/components/ui/MetricStrip";
import { EmergingIssues } from "@/components/dashboard/EmergingIssues";
import { TrendTabsPanel } from "@/components/dashboard/TrendTabsPanel";
import { BreakdownTabsPanel } from "@/components/dashboard/BreakdownTabsPanel";
import { formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const [metrics, trends] = await Promise.all([fetchDashboardMetrics(), fetchTrends()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <MetricStrip
        metrics={[
          { label: "Total conversations", value: metrics.totalConversations.toLocaleString(), delta: metrics.totalConversationsDelta },
          { label: "Active cases", value: metrics.activeCases.toString(), delta: metrics.activeCasesDelta },
          { label: "High severity cases", value: metrics.highSeverityCases.toString(), delta: metrics.highSeverityDelta, emphasis: "critical" },
          { label: "Escalations", value: metrics.escalations.toString(), delta: metrics.escalationsDelta, emphasis: "warning" },
        ]}
      />

      {/* The differentiating capability — surfaced first, not buried */}
      <EmergingIssues trends={trends} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TrendTabsPanel volume={metrics.volumeTrend} escalations={metrics.escalationTrend} />
        <BreakdownTabsPanel metrics={metrics} />
      </div>

      {/* Flat section, not a card — these two numbers don't need a box,
          they need to sit quietly next to each other. */}
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border sm:flex-row sm:divide-x sm:divide-y-0">
        <div className="flex flex-1 items-center justify-between px-5 py-4">
          <div>
            <p className="text-[12px] font-medium text-text-secondary">Resolution rate</p>
            <p className="mt-1 text-[20px] font-semibold tabular-nums text-text-primary">
              {formatPercent(metrics.resolutionRate)}
            </p>
          </div>
          <p className="max-w-[180px] text-right text-[11px] text-text-tertiary">
            Cases resolved out of all cases opened this period
          </p>
        </div>
        <div className="flex flex-1 items-center justify-between px-5 py-4">
          <div>
            <p className="text-[12px] font-medium text-text-secondary">SLA performance</p>
            <p className="mt-1 text-[20px] font-semibold tabular-nums text-text-primary">
              {formatPercent(metrics.slaCompliance)}
            </p>
          </div>
          <p className="max-w-[180px] text-right text-[11px] text-text-tertiary">
            Cases resolved within their committed response window
          </p>
        </div>
      </div>
    </div>
  );
}
