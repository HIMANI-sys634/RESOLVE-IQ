"use client";

import { useEffect, useState } from "react";
import { Panel, PanelHeader, Divider } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <p className="text-[13px] font-medium text-text-primary">
          {label}
        </p>
        <p className="mt-0.5 text-[12px] text-text-secondary">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={() => onChange(!enabled)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 ${
          enabled
            ? "border-accent-strong bg-accent"
            : "border-border-strong bg-panel-hover"
        }`}
      >
        <span
  className={`absolute top-0.5 left-0 h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150 ${
    enabled ? "translate-x-[20px]" : "translate-x-[2px]"
  }`}
/>
      </button>
    </div>
  );
}

export function SettingsForm() {
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [emergingIssueAlerts, setEmergingIssueAlerts] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [severityThreshold, setSeverityThreshold] = useState("medium");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("resolveiq-settings");

    if (!savedSettings) return;

    try {
      const settings = JSON.parse(savedSettings);

      if (typeof settings.autoEscalate === "boolean") {
        setAutoEscalate(settings.autoEscalate);
      }

      if (typeof settings.emergingIssueAlerts === "boolean") {
        setEmergingIssueAlerts(settings.emergingIssueAlerts);
      }

      if (typeof settings.dailyDigest === "boolean") {
        setDailyDigest(settings.dailyDigest);
      }

      if (typeof settings.severityThreshold === "string") {
        setSeverityThreshold(settings.severityThreshold);
      }
    } catch {
      // Ignore invalid saved settings.
    }
  }, []);

  function saveSettings() {
    localStorage.setItem(
      "resolveiq-settings",
      JSON.stringify({
        autoEscalate,
        emergingIssueAlerts,
        dailyDigest,
        severityThreshold,
      })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Panel>
        <PanelHeader
          title="Workspace"
          description="Basic details for this support operations workspace."
        />

        <div className="space-y-3">
          <div>
            <label
              className="text-[12px] font-medium text-text-secondary"
              htmlFor="workspace-name"
            >
              Workspace name
            </label>

            <input
              id="workspace-name"
              defaultValue="ResolveIQ Support Operations"
              className="mt-1.5 w-full rounded-md border border-border bg-bg-raised px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-strong"
            />
          </div>

          <div>
            <label
              className="text-[12px] font-medium text-text-secondary"
              htmlFor="api-url"
            >
              Backend API URL
            </label>

            <input
              id="api-url"
              defaultValue={
                process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
              }
              className="mt-1.5 w-full rounded-md border border-border bg-bg-raised px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-strong"
            />

            <p className="mt-1.5 text-[11px] text-text-tertiary">
              Set via NEXT_PUBLIC_API_URL. Points to the FastAPI service once
              it&apos;s available.
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Escalation"
          description="Control when cases are flagged for human review."
        />

        <div className="divide-y divide-border">
          <Toggle
            enabled={autoEscalate}
            onChange={setAutoEscalate}
            label="Recommend escalation automatically"
            description="Flag a case for human review when the agent's confidence is below threshold."
          />
        </div>

        <div className="mt-3">
          <label
            className="text-[12px] font-medium text-text-secondary"
            htmlFor="severity-threshold"
          >
            Minimum severity for auto-escalation
          </label>

          <select
            id="severity-threshold"
            value={severityThreshold}
            onChange={(e) => setSeverityThreshold(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-border bg-bg-raised px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-strong"
          >
            <option value="low">Low and above</option>
            <option value="medium">Medium and above</option>
            <option value="high">High and above</option>
            <option value="critical">Critical only</option>
          </select>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Notifications"
          description="Choose what the team is alerted about."
        />

        <div className="divide-y divide-border">
          <Toggle
            enabled={emergingIssueAlerts}
            onChange={setEmergingIssueAlerts}
            label="Emerging issue alerts"
            description="Notify the team when a new complaint cluster crosses the growth threshold."
          />

          <Toggle
            enabled={dailyDigest}
            onChange={setDailyDigest}
            label="Daily digest"
            description="Send a daily summary of volume, severity, and escalations."
          />
        </div>
      </Panel>

      <Divider />

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={saveSettings}>
          Save changes
        </Button>

        {saved && (
          <span className="text-[12px] font-medium text-success">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}