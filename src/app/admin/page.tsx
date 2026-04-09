"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarElement,
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
import { Bar, Line } from "react-chartjs-2";
import { BaseLayout } from "@/components/BaseLayout";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

type ResourceBalance = {
  cpu: { shared: number; borrowed: number };
  gpu: { shared: number; borrowed: number };
  ram: { shared: number; borrowed: number };
};

type ServerNode = {
  id: string;
  company: string;
  capacity: number;
  used: number;
  sharedExport: number;
  borrowedImport: number;
  throughput: number;
  ramUsage: number;
  state: "running" | "warning" | "down";
  uptime: number;
  latencyMs: number;
  demandSeries: number[];
  /** Per-resource borrowed vs shared (center-axis visualization). */
  resourceBalance?: ResourceBalance;
};

const TIME_LABELS = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"];

const SERVERS: ServerNode[] = [
  {
    id: "A1",
    company: "Aster Labs",
    capacity: 160,
    used: 114,
    sharedExport: 26,
    borrowedImport: 8,
    throughput: 5.2,
    ramUsage: 68,
    state: "running",
    uptime: 99.7,
    latencyMs: 22,
    demandSeries: [38, 49, 71, 83, 76, 64, 69],
    resourceBalance: {
      cpu: { shared: 24, borrowed: 12 },
      gpu: { shared: 10, borrowed: 5 },
      ram: { shared: 32, borrowed: 16 },
    },
  },
  {
    id: "B2",
    company: "Nova Systems",
    capacity: 140,
    used: 121,
    sharedExport: 11,
    borrowedImport: 19,
    throughput: 4.9,
    ramUsage: 81,
    state: "warning",
    uptime: 98.9,
    latencyMs: 29,
    demandSeries: [45, 58, 67, 88, 92, 84, 79],
    resourceBalance: {
      cpu: { shared: 8, borrowed: 28 },
      gpu: { shared: 4, borrowed: 14 },
      ram: { shared: 12, borrowed: 40 },
    },
  },
  {
    id: "C3",
    company: "Helix Compute",
    capacity: 180,
    used: 84,
    sharedExport: 44,
    borrowedImport: 4,
    throughput: 5.6,
    ramUsage: 52,
    state: "running",
    uptime: 99.8,
    latencyMs: 18,
    demandSeries: [29, 36, 42, 61, 57, 48, 46],
    resourceBalance: {
      cpu: { shared: 44, borrowed: 4 },
      gpu: { shared: 18, borrowed: 2 },
      ram: { shared: 56, borrowed: 8 },
    },
  },
  {
    id: "D4",
    company: "Vertex Ops",
    capacity: 150,
    used: 0,
    sharedExport: 0,
    borrowedImport: 0,
    throughput: 0,
    ramUsage: 0,
    state: "down",
    uptime: 94.2,
    latencyMs: 0,
    demandSeries: [33, 47, 51, 69, 74, 41, 0],
    resourceBalance: {
      cpu: { shared: 0, borrowed: 0 },
      gpu: { shared: 0, borrowed: 0 },
      ram: { shared: 0, borrowed: 0 },
    },
  },
];

const ACTIVITIES = [
  "Aster Labs shared 24 vCPU to the pool",
  "Nova Systems reached 92% peak demand",
  "Vertex Ops server became unreachable at 19:21",
  "Helix Compute borrowed 4 vCPU burst capacity",
  "Global scheduler rebalanced workload across 4 servers",
];

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/70 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </article>
  );
}

function ResourceBalanceRow({
  label,
  shared,
  borrowed,
  unit,
  animated,
}: {
  label: string;
  shared: number;
  borrowed: number;
  unit: string;
  animated: boolean;
}) {
  const max = Math.max(shared, borrowed, 1);
  const leftPct = (borrowed / max) * 50;
  const rightPct = (shared / max) * 50;

  return (
    <div className="grid grid-cols-[2.5rem_2.25rem_1fr_2.25rem] items-center gap-2 sm:grid-cols-[2.75rem_2.75rem_1fr_2.75rem]">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span
        className={`text-right text-xs font-mono tabular-nums ${
          borrowed > 0 ? "text-rose-300/95" : "text-slate-600"
        }`}
      >
        {borrowed > 0 ? borrowed : "—"}
      </span>

      <div className="group/bar relative min-h-[2.25rem]">
        <div className="relative h-9 w-full overflow-visible rounded-full border border-white/10 bg-slate-800/90 shadow-inner ring-1 ring-black/20">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[2px] -translate-x-px bg-gradient-to-b from-white/20 via-white/70 to-white/20 shadow-[0_0_8px_rgba(255,255,255,0.35)]" />

          {borrowed > 0 ? (
            <div
              className="absolute right-1/2 top-1 bottom-1 z-10 origin-right rounded-l-full bg-gradient-to-l from-rose-500 to-rose-600 shadow-[0_0_16px_rgba(244,63,94,0.55)] transition-[width] duration-700 ease-out"
              style={{ width: animated ? `${leftPct}%` : "0%" }}
            />
          ) : null}
          {shared > 0 ? (
            <div
              className="absolute left-1/2 top-1 bottom-1 z-10 origin-left rounded-r-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.5)] transition-[width] duration-700 ease-out"
              style={{ width: animated ? `${rightPct}%` : "0%" }}
            />
          ) : null}
        </div>

        <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover/bar:opacity-100">
          <div className="min-w-[10rem] rounded-lg border border-white/10 bg-slate-950/95 px-2.5 py-2 text-[11px] leading-snug text-slate-200 shadow-xl backdrop-blur-sm">
            <p>
              <span className="text-rose-300">Borrowed:</span>{" "}
              <span className="font-mono font-semibold tabular-nums text-white">
                {borrowed} {unit}
              </span>
            </p>
            <p className="mt-1">
              <span className="text-emerald-300">Shared:</span>{" "}
              <span className="font-mono font-semibold tabular-nums text-white">
                {shared} {unit}
              </span>
            </p>
          </div>
        </div>
      </div>

      <span
        className={`text-left text-xs font-mono tabular-nums ${
          shared > 0 ? "text-emerald-300/95" : "text-slate-600"
        }`}
      >
        {shared > 0 ? shared : "—"}
      </span>
    </div>
  );
}

function ResourceBalanceServerCard({ server }: { server: ServerNode }) {
  const balance = server.resourceBalance!;
  const [barsReady, setBarsReady] = useState(false);
  const [diagHint, setDiagHint] = useState<string | null>(null);
  const isUnreachable = server.state === "down";

  useEffect(() => {
    if (isUnreachable) {
      return;
    }
    const id = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(id);
  }, [isUnreachable]);

  const stateStyles =
    server.state === "running"
      ? {
          dot: "bg-emerald-400",
          ring: "bg-emerald-400/50",
          badge: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
        }
      : server.state === "warning"
        ? {
            dot: "bg-amber-400",
            ring: "bg-amber-400/45",
            badge: "border-amber-400/40 bg-amber-500/15 text-amber-200",
          }
        : {
            dot: "bg-rose-400",
            ring: "bg-rose-400/45",
            badge: "border-rose-400/40 bg-rose-500/15 text-rose-200",
          };

  const statusLabel = server.state === "down" ? "Unreachable" : server.state;

  return (
    <article
      className={`group relative overflow-visible rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] ring-1 transition duration-300 hover:-translate-y-1 ${
        isUnreachable
          ? "border-rose-500/25 ring-rose-500/10 hover:shadow-[0_24px_60px_-10px_rgba(244,63,94,0.12)]"
          : "border-white/10 ring-white/5 hover:shadow-[0_24px_60px_-10px_rgba(59,130,246,0.15)]"
      }`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{server.company}</p>
          <p className="text-xs text-slate-500">Server ID: {server.id}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${stateStyles.badge}`}>
            {statusLabel}
          </span>
          {isUnreachable ? (
            <button
              type="button"
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200 shadow-sm transition hover:border-white/25 hover:bg-white/10"
              onClick={() => {
                setDiagHint("Diagnostics run queued — orchestrator will probe agent & network (demo).");
                window.setTimeout(() => setDiagHint(null), 4500);
              }}
            >
              Diagnostics
            </button>
          ) : null}
        </div>
      </div>

      {isUnreachable ? (
        <div className="relative mt-4 border-t border-white/5 pt-6">
          <div className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-400">No resource signal</p>
            <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-slate-500">
              Shared and borrowed compute are unavailable while this server is unreachable — not borrowing
              from the pool.
            </p>
          </div>
          {diagHint ? (
            <p className="mt-3 text-center text-xs text-slate-400" role="status">
              {diagHint}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="relative mt-4 space-y-4 border-t border-white/5 pt-4">
          <ResourceBalanceRow
            label="CPU"
            shared={balance.cpu.shared}
            borrowed={balance.cpu.borrowed}
            unit="vCPU"
            animated={barsReady}
          />
          <ResourceBalanceRow
            label="GPU"
            shared={balance.gpu.shared}
            borrowed={balance.gpu.borrowed}
            unit="GPU-h"
            animated={barsReady}
          />
          <ResourceBalanceRow
            label="RAM"
            shared={balance.ram.shared}
            borrowed={balance.ram.borrowed}
            unit="GB"
            animated={barsReady}
          />
        </div>
      )}
    </article>
  );
}

function ServerCard({ server }: { server: ServerNode }) {
  if (!server.resourceBalance) {
    return null;
  }
  return <ResourceBalanceServerCard server={server} />;
}

export default function AdminDashboardPage() {
  const totalCapacity = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.capacity, 0),
    [],
  );
  const totalUsed = useMemo(() => SERVERS.reduce((sum, server) => sum + server.used, 0), []);
  const totalShared = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.sharedExport, 0),
    [],
  );
  const totalBorrowed = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.borrowedImport, 0),
    [],
  );
  const avgSpeed = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.throughput, 0) / SERVERS.length,
    [],
  );
  const runningCount = useMemo(
    () => SERVERS.filter((server) => server.state === "running").length,
    [],
  );
  const downCount = useMemo(
    () => SERVERS.filter((server) => server.state === "down").length,
    [],
  );
  const warningCount = useMemo(
    () => SERVERS.filter((server) => server.state === "warning").length,
    [],
  );
  const avgUptime = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.uptime, 0) / SERVERS.length,
    [],
  );
  const avgLatency = useMemo(
    () =>
      SERVERS.filter((server) => server.latencyMs > 0).reduce((sum, server) => sum + server.latencyMs, 0) /
      SERVERS.filter((server) => server.latencyMs > 0).length,
    [],
  );
  const networkThroughput = useMemo(() => avgSpeed * 34.4, [avgSpeed]);

  const demandLineData = useMemo(
    () => ({
      labels: TIME_LABELS,
      datasets: [
        {
          label: "Aster Labs",
          data: SERVERS[0].demandSeries,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.12)",
          fill: true,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 1.8,
        },
        {
          label: "Nova Systems",
          data: SERVERS[1].demandSeries,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,0.08)",
          fill: false,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 1.8,
        },
        {
          label: "Helix Compute",
          data: SERVERS[2].demandSeries,
          borderColor: "#06b6d4",
          backgroundColor: "rgba(6,182,212,0.08)",
          fill: false,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 1.8,
        },
        {
          label: "Vertex Ops",
          data: SERVERS[3].demandSeries,
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.08)",
          fill: false,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 1.8,
        },
      ],
    }),
    [],
  );

  const demandLineOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#334155", boxWidth: 10, boxHeight: 10 },
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b" },
          grid: { display: false },
          border: { color: "#e2e8f0" },
        },
        y: {
          ticks: { color: "#64748b" },
          grid: { color: "#e2e8f0" },
          border: { color: "#e2e8f0" },
          beginAtZero: true,
          suggestedMax: 100,
        },
      },
    }),
    [],
  );

  const demandBarData = useMemo(
    () => ({
      labels: SERVERS.map((server) => server.company),
      datasets: [
        {
          label: "Peak demand %",
          data: SERVERS.map((server) => Math.max(...server.demandSeries)),
          backgroundColor: ["#2563eb", "#4f46e5", "#0891b2", "#ea580c"],
          borderRadius: 8,
        },
        {
          label: "Low demand %",
          data: SERVERS.map((server) => Math.min(...server.demandSeries)),
          backgroundColor: "rgba(148, 163, 184, 0.55)",
          borderRadius: 8,
        },
      ],
    }),
    [],
  );

  const demandBarOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#334155" } },
      },
      scales: {
        x: {
          ticks: { color: "#64748b" },
          grid: { display: false },
          border: { color: "#e2e8f0" },
        },
        y: {
          ticks: { color: "#64748b" },
          grid: { color: "#e2e8f0" },
          border: { color: "#e2e8f0" },
          beginAtZero: true,
          suggestedMax: 100,
        },
      },
    }),
    [],
  );

  const cpuUtil = Math.round((totalUsed / totalCapacity) * 100);
  const avgRam = Math.round(
    SERVERS.reduce((sum, server) => sum + server.ramUsage, 0) / SERVERS.length,
  );

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col text-slate-900">
      <BaseLayout
        headerEyebrow="Platform Operations"
        headerTitle="Corimb Dashboard"
      >
        <div className="space-y-6 p-4 md:p-6 xl:p-8">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KpiCard label="Total compute available" value={`${totalCapacity} vCPU`} sub="Across 4 company servers" />
              <KpiCard label="Compute allocated/shared" value={`${totalShared} vCPU`} sub="Exported into shared pool" />
              <KpiCard label="Borrowed compute demand" value={`${totalBorrowed} vCPU`} sub="Imported from shared pool" />
              <KpiCard label="Avg throughput" value={`${avgSpeed.toFixed(1)} GHz`} sub="Processing speed per server" />
              <KpiCard label="Active companies" value={`${SERVERS.length}`} sub="Each company has 1 server unit" />
              <KpiCard
                label="Running vs unreachable"
                value={`${runningCount} / ${downCount}`}
                sub={`${warningCount} server in warning state`}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.9fr]">
              <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm sm:p-6">
                <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />
                <div className="absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <h2 className="section-title">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
                    Shared Compute Cluster (4 Servers)
                  </h2>
                  <span className="chip">Orchestrated pool</span>
                </div>
                <p className="relative mt-2 text-sm text-slate-600">
                  Each company contributes exactly one server node. Compute is dynamically shared by platform orchestration.
                </p>

                <div className="relative mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {SERVERS.map((server) => (
                    <ServerCard key={server.id} server={server} />
                  ))}
                </div>
              </article>

              <article className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Infrastructure Runtime Health</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      Running servers: <span className="font-semibold">{runningCount}</span>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Warning state: <span className="font-semibold">{warningCount}</span>
                    </div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                      Unreachable servers: <span className="font-semibold">{downCount}</span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      Avg uptime: <span className="font-semibold text-slate-900">{avgUptime.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-rose-800">Active incident</p>
                  <p className="mt-2 text-sm text-rose-700">
                    Vertex Ops is unreachable — no compute flow; demand is rerouted to Aster and Helix.
                  </p>
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-base font-semibold text-slate-900">Demand Trends (24h)</p>
                <p className="text-xs text-slate-500">Demand curves for each server/company.</p>
                <div className="mt-4 h-72 rounded-xl border border-slate-200 bg-white p-3">
                  <Line data={demandLineData} options={demandLineOptions} />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-base font-semibold text-slate-900">Peak vs Low Demand by Server</p>
                <p className="text-xs text-slate-500">Comparison of demand extremes for all 4 servers.</p>
                <div className="mt-4 h-72 rounded-xl border border-slate-200 bg-white p-3">
                  <Bar data={demandBarData} options={demandBarOptions} />
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.15fr]">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-base font-semibold text-slate-900">Compute Resource Statistics</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>Total CPU utilization</span>
                      <span>{cpuUtil}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                        style={{ width: `${cpuUtil}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>Average RAM usage</span>
                      <span>{avgRam}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${avgRam}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      Network throughput
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {networkThroughput.toFixed(1)} Gbps
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      Avg latency
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {avgLatency.toFixed(1)} ms
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-base font-semibold text-slate-900">Recent Activity Feed</p>
                <div className="mt-4 space-y-2">
                  {ACTIVITIES.map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                    >
                      <span
                        className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${
                          idx === 2
                            ? "bg-rose-500"
                            : idx === 1
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      <p className="text-sm text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
        </div>
      </BaseLayout>
    </div>
  );
}
