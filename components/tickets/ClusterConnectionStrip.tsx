import Link from "next/link";
import { Radar, ArrowRight } from "lucide-react";
import { Trend } from "@/lib/types";

/**
 * Shows the complaint-intelligence connection immediately — this data comes
 * from Student 2's classification/clustering step, which is fast, so it
 * doesn't need to wait behind the resolution agent's slower recommendation.
 */
export function ClusterConnectionStrip({ trend }: { trend?: Trend }) {
  if (!trend) return null;

  return (
    <Link
      href={`/intelligence/${trend.clusterId}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-accent-strong/25 bg-accent-soft/40 px-4 py-3 transition-colors duration-150 hover:bg-accent-soft/70"
    >
      <div className="flex items-center gap-2.5 text-[13px] text-text-primary">
        <Radar size={14} strokeWidth={2} className="shrink-0 text-accent-strong" />
        Connected to <span className="font-medium">{trend.clusterName}</span> —{" "}
        <span className="tabular-nums">{trend.count}</span> similar complaints
      </div>
      <ArrowRight size={14} strokeWidth={2} className="shrink-0 text-accent-strong" />
    </Link>
  );
}
