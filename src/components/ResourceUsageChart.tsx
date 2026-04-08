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
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { buildLineChartOptions } from "@/lib/chart-config";

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
  marketPriceSeries: number[];
  currencySymbol: string;
  unitLabel: string;
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
  marketPriceSeries,
  currencySymbol,
  unitLabel,
  isLoading = false,
  error = null,
}: ResourceUsageChartProps) {
  const activeSeries = mode === "sell" ? sellSeries : buySeries;
  const currentLoad = activeSeries.at(-1) ?? 0;
  const marketPricePerUnit = marketPriceSeries.at(-1) ?? 0;
  const currentEarnings = mode === "sell" ? currentLoad * marketPricePerUnit : 0;

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: mode === "sell" ? "Sell volume" : "Buy volume",
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

  const chartOptions = useMemo(
    () => buildLineChartOptions({ unitLabel }),
    [unitLabel],
  );

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
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          Current: <span className="font-semibold text-slate-900">{currentLoad.toFixed(0)} {unitLabel}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          Price: <span className="font-semibold text-slate-900">{currencySymbol}{marketPricePerUnit.toFixed(2)}</span>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          Earnings: <span className="font-semibold text-blue-700">{currencySymbol}{currentEarnings.toFixed(2)}</span>
        </div>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Loading chart data...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </section>
  );
}
