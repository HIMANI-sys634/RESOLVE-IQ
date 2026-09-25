import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Ticket } from "@/lib/types";

export function ConversationPanel({ ticket }: { ticket: Ticket }) {
  return (
    <Panel>
      <PanelHeader title="Customer message" size="lg" />
      <blockquote className="rounded-md border border-border bg-bg-raised p-4 text-[13px] leading-relaxed text-text-primary">
        {ticket.message}
      </blockquote>
    </Panel>
  );
}
