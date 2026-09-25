import { LoadingRows } from "@/components/ui/States";

export default function TicketsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <LoadingRows rows={7} />
    </div>
  );
}
