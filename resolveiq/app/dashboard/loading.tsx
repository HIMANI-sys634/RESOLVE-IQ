import { LoadingCard } from "@/components/ui/States";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <LoadingCard />
      <LoadingCard />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><LoadingCard /></div>
        <LoadingCard />
      </div>
      <LoadingCard />
    </div>
  );
}
