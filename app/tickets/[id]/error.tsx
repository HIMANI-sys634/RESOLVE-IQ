"use client";
import { ErrorState } from "@/components/ui/States";

export default function TicketDetailError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-5xl">
      <ErrorState message={error.message || "Unable to load this case."} onRetry={reset} />
    </div>
  );
}
