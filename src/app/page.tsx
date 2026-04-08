"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const PERIOD_OPTIONS = [7, 30, 90] as const;
type PeriodKey = `${(typeof PERIOD_OPTIONS)[number]}d`;
type TradingPeriodResponse = {
  currency: string;
  unit: string;
  updatedAt: string;
  period: PeriodKey;
  labels: string[];
  buy: number[];
  sell: number[];
  marketPrice: number[];
};

export default function Home() {
  const [tradingMode, setTradingMode] = useState<"buy" | "sell">("sell");
  const [periodDays, setPeriodDays] = useState<(typeof PERIOD_OPTIONS)[number]>(
    30,
  );
  const [metricsData, setMetricsData] = useState<TradingPeriodResponse | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const periodKey = `${periodDays}d` as PeriodKey;
  const activeSeries = useMemo(
    () => metricsData?.[tradingMode] ?? [0, 1],
    [metricsData, tradingMode],
  );
  const activePriceSeries = useMemo(
    () => metricsData?.marketPrice ?? [1, 1],
    [metricsData],
  );

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`/api/trading-metrics?period=${periodKey}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as TradingPeriodResponse;
        setMetricsData(data);
      } catch {
        setLoadError("Could not load trading metrics mock data.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMetrics();
  }, [periodKey]);

  const currentLoad = activeSeries.at(-1) ?? 0;
  const marketPricePerUnit = activePriceSeries.at(-1) ?? 0;
  const currentEarnings =
    tradingMode === "sell" ? currentLoad * marketPricePerUnit : 0;

  const chartValues = useMemo(() => activeSeries, [activeSeries]);
  const chartJsData = useMemo(
    () => ({
      labels: metricsData?.labels ?? [],
      datasets: [
        {
          label: tradingMode === "sell" ? "Sell volume" : "Buy volume",
          data: chartValues,
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
    [chartValues, metricsData?.labels, tradingMode],
  );
  const chartJsOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 850,
        easing: "easeOutQuart",
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#0f172a",
          bodyColor: "#334155",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y ?? 0;
              return ` ${value.toFixed(0)} u`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#64748b",
            maxRotation: 0,
          },
          border: {
            color: "#e2e8f0",
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#e2e8f0",
          },
          ticks: {
            color: "#64748b",
          },
          border: {
            color: "#e2e8f0",
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black tracking-tight text-blue-700">
            HETZNER
          </span>
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
            Cloud Console
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
            Arm64
          </span>
        </div>
        <div className="flex w-full max-w-xl items-center gap-4">
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Search..."
            aria-label="Search"
          />
          <button className="rounded-md border border-slate-200 bg-white p-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            🔔
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[72px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white xl:block">
          <nav className="flex h-full flex-col items-center gap-4 py-4">
            {["≡", "⌂", "☁", "🖥", "🔒", "⚙"].map((item) => (
              <button
                key={item}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="space-y-8 p-4 sm:p-6 lg:p-8">
          <section className="space-y-2 pb-8">
            <h2 className="section-title">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
              Main Container
            </h2>
            <p className="text-sm text-slate-600">
              Only Trading Metrics is kept as requested.
            </p>
          </section>

          <section className="card space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Usage Trend (Chart.js)
                </p>
                <p className="text-xs text-slate-500">
                  Separate light chart block with smooth animation.
                </p>
              </div>
              <span className="chip">Light palette</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTradingMode("sell")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    tradingMode === "sell"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  Sell
                </button>
                <button
                  onClick={() => setTradingMode("buy")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    tradingMode === "buy"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  Buy
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setPeriodDays(option)}
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
              <Line
                data={chartJsData}
                options={chartJsOptions}
                aria-label="Usage trend line chart"
                role="img"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                Current: <span className="font-semibold text-slate-900">{currentLoad.toFixed(0)} u</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                Price: <span className="font-semibold text-slate-900">€{marketPricePerUnit.toFixed(2)}</span>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                Earnings: <span className="font-semibold text-blue-700">€{currentEarnings.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </main>

      </div>
    </div>
  );
}
