"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldAlert, Copy, Send, Radar } from "lucide-react";
import { Recommendation } from "@/lib/types";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { formatPercent } from "@/lib/utils";

type Decision = "pending" | "approved" | "escalated";
type SendState = "idle" | "sent";

export function RecommendationPanels({ rec }: { rec: Recommendation }) {
  const [decision, setDecision] = useState<Decision>(
    rec.escalation === "escalated" ? "escalated" : "pending"
  );
  const [response, setResponse] = useState(rec.recommendedResponse);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [copied, setCopied] = useState(false);

  return (
    <>
      {/* Evidence and recommended actions are one connected investigation
          sequence, not two unrelated cards. */}
      <Panel className="border-accent-strong/25">
        <PanelHeader
          title="Investigation"
          size="lg"
          description="AI-assisted investigation, not a confirmed root cause."
          action={
            <span className="whitespace-nowrap text-[12px] tabular-nums text-text-secondary">
              {formatPercent(rec.confidence)} confidence
            </span>
          }
        />
        <p className="mb-3 text-[11px] font-medium text-text-tertiary">Evidence found</p>
        <ul className="mb-4 space-y-2">
          {rec.evidence.map((e, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-text-secondary">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-tertiary" />
              {e}
            </li>
          ))}
        </ul>
        <p className="mb-3 text-[11px] font-medium text-text-tertiary">Recommended action</p>
        <ol className="space-y-2">
          {rec.recommendedActions.map((a, i) => (
            <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-text-primary">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-panel-hover text-[10px] font-medium text-text-secondary">
                {i + 1}
              </span>
              {a}
            </li>
          ))}
        </ol>

        {rec.relatedClusterId && (
          <Link
            href={`/intelligence/${rec.relatedClusterId}`}
            className="mt-4 flex items-center justify-between gap-3 rounded-md border border-accent-strong/25 bg-accent-soft/40 px-3 py-2.5 text-[12px] transition-colors duration-150 hover:bg-accent-soft/70"
          >
            <span className="flex items-center gap-2 text-text-primary">
              <Radar size={13} strokeWidth={2} className="shrink-0 text-accent-strong" />
              The agent independently matched this to{" "}
              <span className="font-medium">{rec.relatedClusterName ?? "a known cluster"}</span>
              {typeof rec.relatedComplaintCount === "number" && rec.relatedComplaintCount > 0 && (
                <span className="tabular-nums text-text-secondary">
                  &nbsp;({rec.relatedComplaintCount} related complaints)
                </span>
              )}
            </span>
          </Link>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Recommended response" size="lg" description="Edit before sending to the customer." />
        <textarea
          value={response}
          onChange={(e) => {
            setResponse(e.target.value);
            setSendState("idle");
          }}
          rows={5}
          className="w-full resize-none rounded-md border border-border bg-bg-raised p-3 text-[13px] leading-relaxed text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-strong"
        />
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSendState("sent")}
            disabled={sendState === "sent"}
          >
            <Send size={13} strokeWidth={2} />
            {sendState === "sent" ? "Response sent" : "Send response"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(response);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy size={13} strokeWidth={2} />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Escalation"
          size="lg"
          description={
            decision === "escalated"
              ? "This case has been escalated for human review."
              : decision === "approved"
              ? "Recommendation approved."
              : rec.escalation === "recommended"
              ? "Human review recommended before responding."
              : "No escalation required based on current evidence."
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={decision !== "pending"}
            onClick={() => setDecision("approved")}
          >
            <CheckCircle2 size={13} strokeWidth={2} />
            Approve recommendation
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={decision !== "pending"}
            onClick={() => setDecision("escalated")}
          >
            <ShieldAlert size={13} strokeWidth={2} />
            Escalate case
          </Button>
        </div>
      </Panel>
    </>
  );
}
