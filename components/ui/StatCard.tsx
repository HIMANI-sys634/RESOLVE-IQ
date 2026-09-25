import { TrendDelta } from "./Badge";
import { Panel } from "./Panel";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  goodWhenUp = false,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  delta?: number;
  goodWhenUp?: boolean;
  tone?: "neutral" | "critical" | "warning";
  icon?: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-text-secondary">{label}</span>
        {icon && (
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md",
              tone === "critical" && "bg-critical-soft text-critical",
              tone === "warning" && "bg-warning-soft text-warning",
              tone === "neutral" && "bg-panel-hover text-text-tertiary"
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="tabular-nums text-[26px] font-semibold leading-none text-text-primary">
          {value}
        </span>
        {typeof delta === "number" && (
          <TrendDelta value={delta} goodWhenUp={goodWhenUp} />
        )}
      </div>
    </Panel>
  );
}
