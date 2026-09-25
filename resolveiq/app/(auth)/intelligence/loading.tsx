import { LoadingCard } from "@/components/ui/States";
export default function IntelligenceLoading() {
  return (
    <div className="mx-auto max-w-6xl grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)}
    </div>
  );
}
