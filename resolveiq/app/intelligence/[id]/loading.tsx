import { LoadingCard } from "@/components/ui/States";

export default function ClusterLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <LoadingCard />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LoadingCard /><LoadingCard /><LoadingCard />
      </div>
      <LoadingCard />
    </div>
  );
}
