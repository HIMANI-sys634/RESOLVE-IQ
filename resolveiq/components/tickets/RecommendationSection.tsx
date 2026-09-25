import { fetchRecommendationForTicket } from "@/services/api";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { RecommendationPanels } from "./RecommendationPanels";

/**
 * Async server component — intentionally awaits the slower agent call
 * (see services/api.ts) independently of the rest of the page, so it can
 * be streamed in behind a <Suspense> boundary instead of blocking the
 * whole ticket from rendering.
 */
export async function RecommendationSection({ ticketId }: { ticketId: string }) {
  const rec = await fetchRecommendationForTicket(ticketId);

  if (!rec) {
    return (
      <Panel>
        <PanelHeader title="Investigation" size="lg" />
        <p className="text-[12px] leading-relaxed text-text-secondary">
          No related complaints have been connected to this ticket yet. A recommendation will appear
          here once the resolution agent processes it.
        </p>
      </Panel>
    );
  }

  return <RecommendationPanels rec={rec} />;
}
