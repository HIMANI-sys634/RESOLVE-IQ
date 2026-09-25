import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchTicketById, fetchCustomerById, fetchTrendById } from "@/services/api";
import { InvestigationHeader } from "@/components/tickets/InvestigationHeader";
import { ClusterConnectionStrip } from "@/components/tickets/ClusterConnectionStrip";
import { ConversationPanel } from "@/components/tickets/ConversationPanel";
import { RecommendationSection } from "@/components/tickets/RecommendationSection";
import { RecommendationSkeleton } from "@/components/tickets/RecommendationSkeleton";
import { Divider } from "@/components/ui/Panel";
import { formatDateTime } from "@/lib/utils";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await fetchTicketById(id);
  if (!ticket) notFound();

  // Fast data — ticket record, customer, and the cluster this ticket was
  // classified into — renders immediately.
  const [customer, trend] = await Promise.all([
    fetchCustomerById(ticket.customerId),
    ticket.relatedClusterId ? fetchTrendById(ticket.relatedClusterId) : Promise.resolve(undefined),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <InvestigationHeader ticket={ticket} customer={customer} />

      <div className="space-y-4">
        <ClusterConnectionStrip trend={trend} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <ConversationPanel ticket={ticket} />
          </div>

          {/* Slow data — the resolution agent's recommendation — streams in
              independently instead of holding up the whole page. */}
          <div className="space-y-4">
            <Suspense fallback={<RecommendationSkeleton />}>
              <RecommendationSection ticketId={ticket.id} />
            </Suspense>
          </div>
        </div>
      </div>

      <Divider className="my-6" />
      <p className="text-[11px] text-text-tertiary">Last updated {formatDateTime(ticket.updatedAt)}</p>
    </div>
  );
}
