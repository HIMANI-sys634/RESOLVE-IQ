import { cn } from "@/lib/utils";
import { TrendDelta } from "./Badge";

export interface Metric {
  label: string;
  value: string;
  delta?: number;
  goodWhenUp?: boolean;
  emphasis?: "default" | "critical" | "warning";
}

/**
 * A single flat, divided row of top-level metrics — replaces four separate
 * boxed stat cards. One container, one border, quieter than a grid of cards,
 * and it puts the numbers themselves (not four icon chips) as the thing
 * your eye lands on first.
 */
export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-border rounded-lg border border-border bg-panel sm:grid-cols-4 sm:divide-y-0">
      {metrics.map((m) => (
        <div key={m.label} className="px-5 py-4">
          <p className="text-[12px] font-medium text-text-secondary">{m.label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={cn(
                "tabular-nums text-[24px] font-semibold leading-none",
                m.emphasis === "critical" && "text-critical",
                m.emphasis === "warning" && "text-warning",
                (!m.emphasis || m.emphasis === "default") && "text-text-primary"
              )}
            >
              {m.value}
            </span>
            {typeof m.delta === "number" && (
              <TrendDelta value={m.delta} goodWhenUp={m.goodWhenUp} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
