"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { HorizontalBarChart, SegmentedBar } from "./charts";
import { DashboardMetrics } from "@/lib/types";

type TabKey = "category" | "severity" | "sentiment";

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

const TABS: { key: TabKey; label: string; question: string }[] = [
  { key: "category", label: "Category", question: "Which category generates the most complaints?" },
  { key: "severity", label: "Severity", question: "Are high-severity cases a growing share of volume?" },
  { key: "sentiment", label: "Sentiment", question: "How do customers feel across open conversations?" },
];

export function BreakdownTabsPanel({ metrics }: { metrics: DashboardMetrics }) {
  const [tab, setTab] = useState<TabKey>("category");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <Panel>
      <PanelHeader
        title="Conversation breakdown"
        size="lg"
        description={active.question}
      />
      <div className="mb-4 flex rounded-md border border-border bg-bg-raised p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded px-2.5 py-1 text-[12px] font-medium transition-colors duration-150 ${
              tab === t.key ? "bg-panel text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "category" && (
        <HorizontalBarChart
          data={metrics.categoryDistribution.map((c) => ({ label: c.category, count: c.count }))}
        />
      )}
      {tab === "severity" && (
        <SegmentedBar
          segments={metrics.severityDistribution.map((s) => ({
            label: s.severity[0].toUpperCase() + s.severity.slice(1),
            count: s.count,
            color: SEVERITY_COLOR[s.severity[0].toUpperCase() + s.severity.slice(1)],
          }))}
        />
      )}
      {tab === "sentiment" && (
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
