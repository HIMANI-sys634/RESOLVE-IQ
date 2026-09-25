import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchTrendById, fetchTicketsByCluster } from "@/services/api";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { SeverityBadge, SentimentBadge, TrendDelta } from "@/components/ui/Badge";
import { LineTrendChart } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/ui/States";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Inbox } from "lucide-react";

export default async function ClusterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trend = await fetchTrendById(id);
  if (!trend) notFound();

  const relatedTickets = await fetchTicketsByCluster(trend.clusterId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="border-b border-border pb-5">
        <p className="text-[12px] text-text-tertiary">{trend.category} · First detected {formatDate(trend.firstDetected)}</p>
        <h2 className="mt-0.5 text-[18px] font-semibold text-text-primary">{trend.clusterName}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SeverityBadge severity={trend.severity} />
          <SentimentBadge sentiment={trend.sentiment} />
          <span className="rounded-md border border-border bg-panel px-2 py-0.5 text-[12px] font-medium capitalize text-text-secondary">
            {trend.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Panel>
          <p className="text-[11px] text-text-tertiary">Related complaints</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums text-text-primary">{trend.count}</p>
        </Panel>
        <Panel>
          <p className="text-[11px] text-text-tertiary">Growth vs. previous period</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums">
            <TrendDelta value={trend.growthPercent} />
          </p>
        </Panel>
        <Panel>
          <p className="text-[11px] text-text-tertiary">Regions affected</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums text-text-primary">{trend.regionsAffected}</p>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Volume over time" />
        <LineTrendChart data={trend.history} />
      </Panel>

      <Panel className="border-accent-strong/25">
        <PanelHeader title="Potential pattern" description="AI-assisted investigation, not a confirmed root cause." />
        <p className="text-[13px] leading-relaxed text-text-primary">{trend.potentialPattern}</p>
      </Panel>

      <Panel>
        <PanelHeader
          title="Related tickets"
          description={`${relatedTickets.length} tickets connected to this pattern`}
        />
        {relatedTickets.length === 0 ? (
          <EmptyState
            icon={<Inbox size={16} strokeWidth={2} />}
            title="No individual tickets linked yet"
            description="Tickets will appear here as they are classified into this cluster."
          />
        ) : (
          <ul className="divide-y divide-border">
            {relatedTickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tickets/${t.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors duration-150 hover:text-accent-strong"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text-primary">{t.subject}</p>
                    <p className="mt-0.5 text-[12px] text-text-tertiary">{t.id}</p>
                  </div>
                  <ArrowRight size={14} strokeWidth={2} className="shrink-0 text-text-tertiary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
