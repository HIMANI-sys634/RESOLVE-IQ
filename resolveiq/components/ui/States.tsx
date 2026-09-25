import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
      <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-panel-hover text-text-tertiary">
        {icon ?? <Inbox size={16} strokeWidth={2} />}
      </div>
      <p className="text-[13px] font-medium text-text-primary">{title}</p>
      {description && (
        <p className="max-w-sm text-[12px] text-text-secondary">{description}</p>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-critical/30 bg-critical-soft py-12 text-center">
      <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-critical/15 text-critical">
        <AlertCircle size={16} strokeWidth={2} />
      </div>
      <p className="text-[13px] font-medium text-text-primary">Unable to load this data</p>
      <p className="max-w-sm text-[12px] text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCw size={13} strokeWidth={2} />
          Try again
        </Button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 w-full animate-pulse rounded-md bg-panel-hover"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div
      className="h-full min-h-[110px] w-full animate-pulse rounded-lg border border-border bg-panel-hover"
      role="status"
      aria-label="Loading"
    />
  );
}
