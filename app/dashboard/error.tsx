"use client";

import { ErrorState } from "@/components/ui/States";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <ErrorState message={error.message || "Something went wrong loading the overview."} onRetry={reset} />
    </div>
  );
}
