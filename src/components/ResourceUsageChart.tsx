"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { buildLineChartOptions } from "@/lib/chart-config";
import { buildUsageChartSeries } from "@/lib/usage-metrics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

type TradingMode = "buy" | "sell";

type MetricHelpKey = "own" | "shared" | "idle";

const METRIC_HELP: Record<
  MetricHelpKey,
  { title: string; body: string }
> = {
  own: {
    title: "Own usage",
    body:
      "Share of the selected period capacity used by your workload. For each point, own usage is buy volume as a percentage of the period baseline (maximum of own + shared across the visible series).",
  },
  shared: {
    title: "Shared usage",
    body:
      "Share of the selected period capacity used by shared workloads. For each point, shared usage is sell volume as a percentage of the same period baseline (maximum of own + shared across the visible series).",
  },
  idle: {
    title: "Idle",
    body:
      "Capacity not accounted for by own and shared usage in the chart: Idle % = 100% − Own usage % − Shared usage % (clamped to 0–100%).",
  },
};

type ResourceUsageChartProps = {
  title: string;
  subtitle: string;
  mode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
  periodDays: number;
  periodOptions: readonly number[];
  onPeriodChange: (days: number) => void;
  labels: string[];
  buySeries: number[];
  sellSeries: number[];
  isLoading?: boolean;
  error?: string | null;
};

export function ResourceUsageChart({
  title,
  subtitle,
  mode,
  onModeChange,
  periodDays,
  periodOptions,
  onPeriodChange,
  labels,
  buySeries,
  sellSeries,
  isLoading = false,
  error = null,
}: ResourceUsageChartProps) {
  const [helpMetric, setHelpMetric] = useState<MetricHelpKey | null>(null);

  useEffect(() => {
    if (helpMetric === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelpMetric(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpMetric]);

  const { ownUsagePercentSeries, sharedUsagePercentSeries, idlePercentSeries } =
    useMemo(() => buildUsageChartSeries(buySeries, sellSeries), [buySeries, sellSeries]);

  const activeSeries =
    mode === "sell" ? sharedUsagePercentSeries : ownUsagePercentSeries;
  const currentOwnUsage = ownUsagePercentSeries.at(-1) ?? 0;
  const currentSharedUsage = sharedUsagePercentSeries.at(-1) ?? 0;
  const currentIdle = idlePercentSeries.at(-1) ?? 0;

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: mode === "sell" ? "Shared usage" : "Own usage",
          data: activeSeries,
          fill: true,
          borderColor: "#2563eb",
          backgroundColor: "rgba(59, 130, 246, 0.14)",
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#1d4ed8",
        },
      ],
    }),
    [labels, mode, activeSeries],
  );

  const chartOptions = useMemo(() => buildLineChartOptions(), []);

  const helpContent = helpMetric ? METRIC_HELP[helpMetric] : null;

  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="chip">Light palette</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onModeChange("sell")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              mode === "sell"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-700 hover:border-blue-300"
            }`}
          >
            Sell
          </button>
          <button
            onClick={() => onModeChange("buy")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              mode === "buy"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-700 hover:border-blue-300"
            }`}
          >
            Buy
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {periodOptions.map((option) => (
            <button
              key={option}
              onClick={() => onPeriodChange(option)}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                periodDays === option
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 rounded-xl border border-slate-200 bg-white p-3">
        <Line data={chartData} options={chartOptions} aria-label={title} role="img" />
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span>Own Usage:</span>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">
              {currentOwnUsage.toFixed(1)}%
            </span>
            <button
              type="button"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-semibold leading-none text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              aria-label="What is Own usage?"
              onClick={() => setHelpMetric("own")}
            >
              ?
            </button>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span>Shared Usage:</span>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">
              {currentSharedUsage.toFixed(1)}%
            </span>
            <button
              type="button"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-semibold leading-none text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              aria-label="What is Shared usage?"
              onClick={() => setHelpMetric("shared")}
            >
              ?
            </button>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <span>Idle:</span>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-700">
              {currentIdle.toFixed(1)}%
            </span>
            <button
              type="button"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-300 bg-white text-[10px] font-semibold leading-none text-blue-700 transition hover:border-blue-500 hover:bg-blue-100"
              aria-label="What is Idle?"
              onClick={() => setHelpMetric("idle")}
            >
              ?
            </button>
          </span>
        </div>
      </div>

      {helpContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="presentation"
          onClick={() => setHelpMetric(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="metric-help-title"
            className="max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="metric-help-title"
              className="text-base font-semibold text-slate-900"
            >
              {helpContent.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {helpContent.body}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setHelpMetric(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <p className="text-xs text-slate-500">Loading chart data...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </section>
  );
}
