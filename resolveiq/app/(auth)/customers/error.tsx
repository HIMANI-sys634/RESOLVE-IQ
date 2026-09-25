"use client";
import { ErrorState } from "@/components/ui/States";
export default function CustomersError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl">
      <ErrorState message={error.message || "Unable to load customers."} onRetry={reset} />
    </div>
  );
}
