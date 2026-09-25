import { LoadingCard } from "@/components/ui/States";

export default function TicketDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="h-24 w-full animate-pulse rounded-lg bg-panel-hover" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LoadingCard />
        <LoadingCard />
      </div>
    </div>
  );
}
