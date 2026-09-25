import Link from "next/link";
import { CaseHistoryEntry } from "@/lib/types";
import { EscalationBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { formatDateTime } from "@/lib/utils";

const RESOLUTION_LABEL: Record<CaseHistoryEntry["resolution"], string> = {
  resolved: "Resolved",
  pending: "Pending",
  reopened: "Reopened",
};

const RESOLUTION_CLASS: Record<CaseHistoryEntry["resolution"], string> = {
  resolved: "text-success",
  pending: "text-text-secondary",
  reopened: "text-critical",
};

export function CaseHistoryTable({ entries }: { entries: CaseHistoryEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState title="No cases have been closed out yet" description="Resolved and escalated cases will appear here." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-bg-raised text-[12px] text-text-tertiary">
            <th className="px-4 py-2.5 font-medium">Case</th>
            <th className="px-4 py-2.5 font-medium">Issue</th>
            <th className="px-4 py-2.5 font-medium">Action taken</th>
            <th className="px-4 py-2.5 font-medium">Escalation</th>
            <th className="px-4 py-2.5 font-medium">Resolution</th>
            <th className="px-4 py-2.5 font-medium">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-b-0 transition-colors duration-150 hover:bg-panel">
              <td className="px-4 py-3">
                <Link href={`/tickets/${e.ticketId}`} className="text-[13px] font-medium text-text-primary hover:underline">
                  {e.id}
                </Link>
                <p className="mt-0.5 text-[12px] text-text-tertiary">{e.ticketId}</p>
              </td>
              <td className="px-4 py-3 text-[12px] text-text-secondary">{e.issue}</td>
              <td className="px-4 py-3 text-[12px] text-text-secondary">{e.actionTaken}</td>
              <td className="px-4 py-3">
                <EscalationBadge state={e.escalation} />
              </td>
              <td className={`px-4 py-3 text-[12px] font-medium ${RESOLUTION_CLASS[e.resolution]}`}>
                {RESOLUTION_LABEL[e.resolution]}
              </td>
              <td className="px-4 py-3 text-[12px] tabular-nums text-text-tertiary">{formatDateTime(e.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
