import { cn } from "@/lib/utils";

/** A bordered container. Reserve this for content that genuinely needs to
 * read as a distinct, self-contained unit — not a default wrapper for
 * every block of content. For secondary content, use <Section> instead. */
export function Panel({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-panel",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

/** A flat, borderless block of content — used for secondary or connective
 * content where a full card would just add visual weight without meaning.
 * Separated from neighboring sections with a divider, not a box. */
export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("py-4 first:pt-0 last:pb-0", className)}>{children}</div>;
}

export function PanelHeader({
  title,
  description,
  action,
  size = "md",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2
          className={cn(
            "font-semibold text-text-primary",
            size === "lg" ? "text-[15px]" : "text-[13px]"
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-[12px] text-text-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
