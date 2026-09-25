import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Ticket, Customer } from "@/lib/types";
import { SeverityBadge, StatusBadge, EscalationBadge, SentimentBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export function InvestigationHeader({ ticket, customer }: { ticket: Ticket; customer?: Customer }) {
  return (
    <div className="space-y-4 pb-5">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-tertiary transition-colors duration-150 hover:text-text-primary"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        Tickets
      </Link>

      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] text-text-tertiary">{ticket.id}</p>
          <h2 className="mt-0.5 text-[18px] font-semibold text-text-primary">{ticket.subject}</h2>
          <p className="mt-1 text-[12px] text-text-secondary">
            {customer?.displayName ?? ticket.customerId} · Opened {formatDateTime(ticket.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={ticket.severity} />
          <StatusBadge status={ticket.status} />
          <EscalationBadge state={ticket.escalation} />
        </div>
      </div>

      {/* Inline classification metadata — no card, this is metadata about
          the message below it, not a separate topic. */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] sm:grid-cols-4">
        <div className="flex items-center gap-2">
          <dt className="text-text-tertiary">Category</dt>
          <dd className="font-medium text-text-primary">{ticket.category}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-text-tertiary">Sentiment</dt>
          <dd><SentimentBadge sentiment={ticket.sentiment} /></dd>
        </div>
        {ticket.orderId && (
          <div className="flex items-center gap-2">
            <dt className="text-text-tertiary">Order</dt>
            <dd className="font-medium text-text-primary">{ticket.orderId}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
