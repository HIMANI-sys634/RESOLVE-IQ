"use client";

import { useId } from "react";

/**
 * Lightweight, dependency-free SVG charts.
 *
 * These charts are intentionally defensive:
 * - Empty data renders a useful empty state.
 * - One data point renders safely.
 * - Multiple data points render the normal chart.
 */

export function LineTrendChart({
  data,
  height = 160,
  color = "var(--color-accent)",
}: {
  data?: { date: string; count: number }[];
  height?: number;
  color?: string;
}) {
  const width = 560;
  const padding = 24;
  const safeData = data ?? [];
  const gradientId = useId();

  if (safeData.length === 0) {
    return (
      <div
        className="flex h-[160px] items-center justify-center text-[12px] text-text-tertiary"
        role="img"
        aria-label="No trend data available"
      >
        No escalation data available yet.
      </div>
    );
  }

  if (safeData.length === 1) {
    const point = safeData[0];

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Trend over time"
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--color-border)"
          strokeWidth={1}
        />

        <circle
          cx={width / 2}
          cy={height / 2}
          r={3}
          fill={color}
        />

        <text
          x={width / 2}
          y={height - 6}
          textAnchor="middle"
          className="fill-[var(--color-text-tertiary)]"
          fontSize={10}
        >
          {point.date}
        </text>
      </svg>
    );
  }

  const max = Math.max(...safeData.map((d) => d.count));
  const min = Math.min(...safeData.map((d) => d.count));
  const range = max - min || 1;
  const step = (width - padding * 2) / (safeData.length - 1);

  const points = safeData.map((d, i) => {
    const x = padding + i * step;
    const y =
      padding +
      (1 - (d.count - min) / range) * (height - padding * 2);

    return {
      x,
      y,
      ...d,
    };
  });

  const linePath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
    )
    .join(" ");

  const areaPath =
    `${linePath} ` +
    `L ${points[points.length - 1].x} ${height - padding} ` +
    `L ${points[0].x} ${height - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Trend over time"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={color}
            stopOpacity="0.18"
          />
          <stop
            offset="100%"
            stopColor={color}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="var(--color-border)"
        strokeWidth={1}
      />

      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />

      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3 : 0}
          fill={color}
        />
      ))}

      {points.map(
        (p, i) =>
          (i === 0 ||
            i === points.length - 1 ||
            i === Math.floor(points.length / 2)) && (
            <text
              key={`label-${i}`}
              x={p.x}
              y={height - 6}
              textAnchor={
                i === 0
                  ? "start"
                  : i === points.length - 1
                    ? "end"
                    : "middle"
              }
              className="fill-[var(--color-text-tertiary)]"
              fontSize={10}
            >
              {p.date}
            </text>
          )
      )}
    </svg>
  );
}

export function HorizontalBarChart({
  data,
  colorFor,
}: {
  data: { label: string; count: number }[];
  colorFor?: (label: string) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-[12px] text-text-tertiary">
        No category data available yet.
      </div>
    );
  }

  const max = Math.max(
    ...data.map((d) => d.count),
    1
  );

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div
          key={d.label}
          className="grid grid-cols-[104px_1fr_36px] items-center gap-3"
        >
          <span className="truncate text-[12px] text-text-secondary">
            {d.label}
          </span>

          <div className="h-2 overflow-hidden rounded-full bg-panel-hover">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(d.count / max) * 100}%`,
                background: colorFor
                  ? colorFor(d.label)
                  : "var(--color-accent)",
              }}
            />
          </div>

          <span className="text-right text-[12px] tabular-nums text-text-primary">
            {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({
  data,
  color = "var(--color-accent)",
  width = 96,
  height = 28,
}: {
  data: { date: string; count: number }[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) {
    return null;
  }

  if (data.length === 1) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-hidden="true"
      >
        <circle
          cx={width / 2}
          cy={height / 2}
          r={2}
          fill={color}
        />
      </svg>
    );
  }

  const max = Math.max(...data.map((d) => d.count));
  const min = Math.min(...data.map((d) => d.count));
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((d, i) => {
    const x = i * step;
    const y =
      (1 - (d.count - min) / range) * (height - 4) + 2;

    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SegmentedBar({
  segments,
}: {
  segments: {
    label: string;
    count: number;
    color: string;
  }[];
}) {
  if (segments.length === 0) {
    return (
      <div className="flex h-10 items-center text-[12px] text-text-tertiary">
        No distribution data available yet.
      </div>
    );
  }

  const total = segments.reduce(
    (sum, s) => sum + s.count,
    0
  );

  if (total === 0) {
    return (
      <div className="flex h-10 items-center text-[12px] text-text-tertiary">
        No distribution data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-panel-hover">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{
              width: `${(s.count / total) * 100}%`,
              background: s.color,
            }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 text-[12px] text-text-secondary"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color }}
            />

            {s.label}

            <span className="tabular-nums text-text-primary">
              {Math.round((s.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}