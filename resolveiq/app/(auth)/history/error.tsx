"use client";
import { ErrorState } from "@/components/ui/States";
export default function HistoryError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl">
      <ErrorState message={error.message || "Unable to load case history."} onRetry={reset} />
    </div>
  );
}
