import { fetchTickets } from "@/services/api";
import { TicketTable } from "@/components/tickets/TicketTable";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [tickets, params] = await Promise.all([fetchTickets(), searchParams]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <p className="text-[13px] text-text-secondary">
        {tickets.length} conversations · Filter by status or search to find a specific case.
      </p>
      <TicketTable tickets={tickets} initialQuery={params.q ?? ""} />
    </div>
  );
}
