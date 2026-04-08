"use client";

import { useEffect, useMemo, useState } from "react";

const PERIOD_OPTIONS = [7, 30, 90] as const;

export default function Home() {
  const [tradingMode, setTradingMode] = useState<"buy" | "sell">("sell");
  const [periodDays, setPeriodDays] = useState<(typeof PERIOD_OPTIONS)[number]>(
    30,
  );
  const [currentLoad, setCurrentLoad] = useState(24);
  const [marketPricePerUnit, setMarketPricePerUnit] = useState(1.18);

  const currentEarnings = useMemo(
    () => (tradingMode === "sell" ? currentLoad * marketPricePerUnit : 0),
    [tradingMode, currentLoad, marketPricePerUnit],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketPricePerUnit((current) => {
        const delta = (Math.random() - 0.5) * 0.08;
        return Math.min(2.2, Math.max(0.4, current + delta));
      });

      setCurrentLoad((current) => {
        const direction = tradingMode === "sell" ? 1 : 0.7;
        const delta = (Math.random() - 0.2) * 3 * direction;
        return Math.min(100, Math.max(5, current + delta));
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [tradingMode]);

  const chartValues = useMemo(() => {
    const pointsCount = periodDays <= 30 ? periodDays : 30;
    const modeFactor = tradingMode === "sell" ? 1.25 : 0.95;
    const base = Math.max(6, currentLoad * modeFactor);

    return Array.from({ length: pointsCount }, (_, index) => {
      const progress = index / Math.max(1, pointsCount - 1);
      const trend = base * (0.55 + progress * 0.55);
      const waveA = Math.sin(index * 0.45) * 3.6;
      const waveB = Math.cos(index * 0.22) * 1.9;
      const value = trend + waveA + waveB;
      return Math.min(100, Math.max(3, value));
    });
  }, [periodDays, tradingMode, currentLoad]);

  const chartGeometry = useMemo(() => {
    const width = 900;
    const height = 280;
    const padding = 24;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const min = Math.min(...chartValues);
    const max = Math.max(...chartValues);
    const range = Math.max(1, max - min);

    const points = chartValues.map((value, index) => {
      const x =
        padding + (index * plotWidth) / Math.max(1, chartValues.length - 1);
      const y = padding + ((max - value) * plotHeight) / range;
      return { x, y };
    });

    const linePath = points
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(" ");

    const areaPath = `${linePath} L ${(
      padding + plotWidth
    ).toFixed(2)} ${(padding + plotHeight).toFixed(2)} L ${padding.toFixed(
      2,
    )} ${(padding + plotHeight).toFixed(2)} Z`;

    return { width, height, padding, plotWidth, plotHeight, min, max, areaPath, linePath };
  }, [chartValues]);

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

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[72px_1fr_320px]">
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
        </main>

        <aside className="border-l border-slate-200 bg-white p-4 sm:p-6 xl:sticky xl:top-0 xl:h-[calc(100vh-4rem)]">
          <div className="space-y-4">
            <div className="card p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Trading Metrics
                  </p>
                  <span className="text-xs text-slate-500">
                    Mode: {tradingMode.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTradingMode("sell")}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      tradingMode === "sell"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    Sell
                  </button>
                  <button
                    onClick={() => setTradingMode("buy")}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      tradingMode === "buy"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    Buy
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <svg
                    viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                    className="h-56 w-full"
                    role="img"
                    aria-label="Trading load chart"
                  >
                    <line
                      x1={chartGeometry.padding}
                      y1={chartGeometry.padding}
                      x2={chartGeometry.padding}
                      y2={chartGeometry.padding + chartGeometry.plotHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <line
                      x1={chartGeometry.padding}
                      y1={chartGeometry.padding + chartGeometry.plotHeight}
                      x2={chartGeometry.padding + chartGeometry.plotWidth}
                      y2={chartGeometry.padding + chartGeometry.plotHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <path
                      d={chartGeometry.areaPath}
                      fill="rgba(37, 99, 235, 0.20)"
                    />
                    <path
                      d={chartGeometry.linePath}
                      stroke="#2563eb"
                      strokeWidth="3"
                      fill="none"
                    />
                  </svg>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{periodDays} days ago</span>
                    <span>Today</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setPeriodDays(option)}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                        periodDays === option
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-700 hover:border-blue-300"
                      }`}
                    >
                      {option}d
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current load</span>
                    <span className="font-semibold">{currentLoad.toFixed(0)} u</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Market price / unit</span>
                    <span className="font-semibold">€{marketPricePerUnit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current earnings</span>
                    <span className="font-semibold text-blue-700">
                      €{currentEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
