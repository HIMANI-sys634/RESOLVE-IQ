import { fetchTrends, fetchDashboardMetrics } from "@/services/api";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { ClusterGrid } from "@/components/intelligence/ClusterGrid";
import { DistributionTabsPanel } from "@/components/intelligence/DistributionTabsPanel";
import {
  HorizontalBarChart,
  LineTrendChart,
} from "@/components/dashboard/charts";

export default async function IntelligencePage() {
  const [trends, metrics] = await Promise.all([
    fetchTrends(),
    fetchDashboardMetrics(),
  ]);

  const categoryTotals = new Map<string, number>();

  for (const t of trends) {
    // Prefer the actual issue category.
    // Avoid displaying Student 2's generic "General" label.
    const category =
      t.category &&
      t.category.toLowerCase() !== "general"
        ? t.category
        : t.clusterName;

    categoryTotals.set(
      category,
      (categoryTotals.get(category) ?? 0) + t.count
    );
  }

  const categoryTrendData = Array.from(
    categoryTotals.entries()
  ).map(([label, count]) => ({
    label,
    count,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold text-text-primary">
          Recurring complaint clusters
        </h2>

        <p className="mt-1 text-[12px] text-text-secondary">
          Complaints connected by pattern-detection into a shared issue.
          Open a cluster to see the evidence and every related ticket.
        </p>
      </div>

      <ClusterGrid trends={trends} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Category trends"
            description="Complaint volume by category across all detected clusters."
          />

          <HorizontalBarChart data={categoryTrendData} />
        </Panel>

        <DistributionTabsPanel metrics={metrics} />

        <Panel className="lg:col-span-3">
          <PanelHeader
            title="Escalation trend"
            description="How many cases required human escalation, over time."
          />

          <LineTrendChart
            data={metrics.escalationTrend}
            color="var(--color-warning)"
          />
        </Panel>
      </div>
    </div>
  );
}