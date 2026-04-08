"use client";

import { useEffect, useState } from "react";
import { ResourceUsageChart } from "@/components/ResourceUsageChart";

const PERIOD_OPTIONS = [7, 30, 90] as const;
type PeriodKey = `${(typeof PERIOD_OPTIONS)[number]}d`;
type ResourceKey = "gpu" | "cpu";
type TradingResourceResponse = {
  currency: string;
  unit: string;
  updatedAt: string;
  period: PeriodKey;
  resource: ResourceKey;
  labels: string[];
  buy: number[];
  sell: number[];
  marketPrice: number[];
};

export default function Home() {
  const [gpuMode, setGpuMode] = useState<"buy" | "sell">("sell");
  const [cpuMode, setCpuMode] = useState<"buy" | "sell">("sell");
  const [gpuPeriodDays, setGpuPeriodDays] = useState<(typeof PERIOD_OPTIONS)[number]>(30);
  const [cpuPeriodDays, setCpuPeriodDays] = useState<(typeof PERIOD_OPTIONS)[number]>(30);
  const [gpuData, setGpuData] = useState<TradingResourceResponse | null>(null);
  const [cpuData, setCpuData] = useState<TradingResourceResponse | null>(null);
  const [gpuLoading, setGpuLoading] = useState(false);
  const [cpuLoading, setCpuLoading] = useState(false);
  const [gpuError, setGpuError] = useState<string | null>(null);
  const [cpuError, setCpuError] = useState<string | null>(null);

  useEffect(() => {
    const loadGpuMetrics = async () => {
      setGpuLoading(true);
      setGpuError(null);
      try {
        const period = `${gpuPeriodDays}d` as PeriodKey;
        const response = await fetch(
          `/api/trading-metrics?period=${period}&resource=gpu`,
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as TradingResourceResponse;
        setGpuData(data);
      } catch {
        setGpuData(null);
        setGpuError("Could not load GPU metrics.");
      } finally {
        setGpuLoading(false);
      }
    };

    void loadGpuMetrics();
  }, [gpuPeriodDays]);

  useEffect(() => {
    const loadCpuMetrics = async () => {
      setCpuLoading(true);
      setCpuError(null);
      try {
        const period = `${cpuPeriodDays}d` as PeriodKey;
        const response = await fetch(
          `/api/trading-metrics?period=${period}&resource=cpu`,
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as TradingResourceResponse;
        setCpuData(data);
      } catch {
        setCpuData(null);
        setCpuError("Could not load CPU metrics.");
      } finally {
        setCpuLoading(false);
      }
    };

    void loadCpuMetrics();
  }, [cpuPeriodDays]);

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

          <ResourceUsageChart
            title="GPU Usage Trend"
            subtitle="Independent GPU chart controls and timeline."
            mode={gpuMode}
            onModeChange={setGpuMode}
            periodDays={gpuPeriodDays}
            periodOptions={PERIOD_OPTIONS}
            onPeriodChange={(days) => setGpuPeriodDays(days as (typeof PERIOD_OPTIONS)[number])}
            labels={gpuData?.labels ?? []}
            buySeries={gpuData?.buy ?? []}
            sellSeries={gpuData?.sell ?? []}
            isLoading={gpuLoading}
            error={gpuError}
          />

          <ResourceUsageChart
            title="CPU Usage Trend"
            subtitle="Independent CPU chart controls and timeline."
            mode={cpuMode}
            onModeChange={setCpuMode}
            periodDays={cpuPeriodDays}
            periodOptions={PERIOD_OPTIONS}
            onPeriodChange={(days) => setCpuPeriodDays(days as (typeof PERIOD_OPTIONS)[number])}
            labels={cpuData?.labels ?? []}
            buySeries={cpuData?.buy ?? []}
            sellSeries={cpuData?.sell ?? []}
            isLoading={cpuLoading}
            error={cpuError}
          />
        </main>

      </div>
    </div>
  );
}
