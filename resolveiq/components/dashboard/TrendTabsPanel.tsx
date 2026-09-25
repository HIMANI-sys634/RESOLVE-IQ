"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { LineTrendChart } from "./charts";

type TabKey = "volume" | "escalations";

const TABS: { key: TabKey; label: string; question: string; color: string }[] = [
  { key: "volume", label: "Volume", question: "Are complaints increasing?", color: "var(--color-accent)" },
  { key: "escalations", label: "Escalations", question: "Are more cases needing human review?", color: "var(--color-warning)" },
];

export function TrendTabsPanel({
  volume,
  escalations,
}: {
  volume: { date: string; count: number }[];
  escalations: { date: string; count: number }[];
}) {
  const [tab, setTab] = useState<TabKey>("volume");
  const active = TABS.find((t) => t.key === tab)!;
  const data = tab === "volume" ? volume : escalations;

  return (
    <Panel className="lg:col-span-2">
      <PanelHeader
        title="Conversation volume"
        size="lg"
        description={active.question}
        action={
          <div className="flex rounded-md border border-border bg-bg-raised p-0.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded px-2.5 py-1 text-[12px] font-medium transition-colors duration-150 ${
                  tab === t.key ? "bg-panel text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />
      <LineTrendChart data={data} color={active.color} />
    </Panel>
  );
}
