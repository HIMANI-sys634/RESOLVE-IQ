"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { SegmentedBar } from "@/components/dashboard/charts";
import { DashboardMetrics } from "@/lib/types";

type TabKey = "severity" | "sentiment";

const SEVERITY_COLOR: Record<string, string> = {
  Critical: "var(--color-critical)",
  High: "var(--color-critical)",
  Medium: "var(--color-warning)",
  Low: "var(--color-text-tertiary)",
};
const SENTIMENT_COLOR: Record<string, string> = {
  Negative: "var(--color-critical)",
  Neutral: "var(--color-text-tertiary)",
  Positive: "var(--color-success)",
};

export function DistributionTabsPanel({ metrics }: { metrics: DashboardMetrics }) {
  const [tab, setTab] = useState<TabKey>("severity");

  return (
    <Panel>
      <PanelHeader
        title="Distribution"
        description={
          tab === "severity"
            ? "Share of all open conversations by severity."
            : "How customers feel across open conversations."
        }
        action={
          <div className="flex rounded-md border border-border bg-bg-raised p-0.5">
            {(["severity", "sentiment"] as TabKey[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded px-2.5 py-1 text-[12px] font-medium capitalize transition-colors duration-150 ${
                  tab === t ? "bg-panel text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />
      {tab === "severity" ? (
        <SegmentedBar
          segments={metrics.severityDistribution.map((s) => ({
            label: s.severity[0].toUpperCase() + s.severity.slice(1),
            count: s.count,
            color: SEVERITY_COLOR[s.severity[0].toUpperCase() + s.severity.slice(1)],
          }))}
        />
      ) : (
        <SegmentedBar
          segments={metrics.sentimentDistribution.map((s) => ({
            label: s.sentiment[0].toUpperCase() + s.sentiment.slice(1),
            count: s.count,
            color: SENTIMENT_COLOR[s.sentiment[0].toUpperCase() + s.sentiment.slice(1)],
          }))}
        />
      )}
    </Panel>
  );
}
