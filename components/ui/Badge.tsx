import { cn } from "@/lib/utils";
import {
  Severity,
  Sentiment,
  TicketStatus,
  EscalationState,
} from "@/lib/types";
import {
  severityLabel,
  sentimentLabel,
  statusLabel,
  escalationLabel,
} from "@/lib/utils";
import {
  AlertTriangle,
  AlertOctagon,
  Circle,
  Minus,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

type Tone = "neutral" | "accent" | "success" | "warning" | "critical";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-panel-hover text-text-secondary border-border-strong",
  accent: "bg-accent-soft text-accent-strong border-accent-strong/40",
  success: "bg-success-soft text-success border-success/30",
  warning: "bg-warning-soft text-warning border-warning/30",
  critical: "bg-critical-soft text-critical border-critical/30",
};

function BaseBadge({
  tone,
  children,
  icon,
}: {
  tone: Tone;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-medium leading-5",
        toneClasses[tone]
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone: Tone =
    severity === "critical" ? "critical" : severity === "high" ? "critical" : severity === "medium" ? "warning" : "neutral";
  const icon =
    severity === "critical" || severity === "high" ? (
      <AlertOctagon size={12} strokeWidth={2.25} />
    ) : severity === "medium" ? (
      <AlertTriangle size={12} strokeWidth={2.25} />
    ) : (
      <Circle size={8} strokeWidth={3} fill="currentColor" />
    );
  return (
    <BaseBadge tone={tone} icon={icon}>
      {severityLabel[severity]}
    </BaseBadge>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const tone: Tone =
    sentiment === "negative" ? "critical" : sentiment === "positive" ? "success" : "neutral";
  const icon =
    sentiment === "negative" ? (
      <TrendingDown size={12} strokeWidth={2.25} />
    ) : sentiment === "positive" ? (
      <TrendingUp size={12} strokeWidth={2.25} />
    ) : (
      <Minus size={12} strokeWidth={2.25} />
    );
  return (
    <BaseBadge tone={tone} icon={icon}>
      {sentimentLabel[sentiment]}
    </BaseBadge>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const tone: Tone =
    status === "resolved" ? "success" : status === "escalated" ? "critical" : status === "investigating" ? "accent" : "neutral";
  return <BaseBadge tone={tone}>{statusLabel[status]}</BaseBadge>;
}

export function EscalationBadge({ state }: { state: EscalationState }) {
  const tone: Tone = state === "escalated" ? "critical" : state === "recommended" ? "warning" : "neutral";
  const icon =
    state === "none" ? (
      <CheckCircle2 size={12} strokeWidth={2.25} />
    ) : (
      <ShieldAlert size={12} strokeWidth={2.25} />
    );
  return (
    <BaseBadge tone={tone} icon={icon}>
      {escalationLabel[state]}
    </BaseBadge>
  );
}

/**
 * A directional delta, e.g. "+34%" next to a metric.
 * By default a rising number reads as bad news (more complaints, more
 * escalations) — pass `goodWhenUp` for metrics like resolution rate where
 * a rise is the desired direction.
 */
export function TrendDelta({
  value,
  goodWhenUp = false,
}: {
  value: number;
  goodWhenUp?: boolean;
}) {
  const positive = value > 0;
  const flat = value === 0;
  const isGood = flat ? null : goodWhenUp ? positive : !positive;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-medium",
        flat ? "text-text-tertiary" : isGood ? "text-success" : "text-critical"
      )}
    >
      {!flat && (positive ? <TrendingUp size={12} strokeWidth={2.25} /> : <TrendingDown size={12} strokeWidth={2.25} />)}
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}
