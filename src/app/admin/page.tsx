"use client";

import { useMemo } from "react";
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

type CompanyNode = {
  id: string;
  name: string;
  available: number;
  shared: number;
  outsourced: number;
  peakDemand: number;
  lowDemand: number;
  avgSpeed: number;
  runningContainers: number;
  downContainers: number;
};

const CLUSTER: CompanyNode[] = [
  {
    id: "A1",
    name: "Aster Labs",
    available: 88,
    shared: 41,
    outsourced: 21,
    peakDemand: 79,
    lowDemand: 22,
    avgSpeed: 4.8,
    runningContainers: 12,
    downContainers: 1,
  },
  {
    id: "B2",
    name: "Nova Systems",
    available: 72,
    shared: 36,
    outsourced: 28,
    peakDemand: 85,
    lowDemand: 30,
    avgSpeed: 5.1,
    runningContainers: 10,
    downContainers: 2,
  },
  {
    id: "C3",
    name: "Helix Compute",
    available: 94,
    shared: 52,
    outsourced: 16,
    peakDemand: 71,
    lowDemand: 19,
    avgSpeed: 4.6,
    runningContainers: 14,
    downContainers: 0,
  },
  {
    id: "D4",
    name: "Vertex Ops",
    available: 66,
    shared: 33,
    outsourced: 35,
    peakDemand: 91,
    lowDemand: 34,
    avgSpeed: 5.3,
    runningContainers: 9,
    downContainers: 3,
  },
];

const LABELS = CLUSTER.map((company) => company.name);

export default function AdminDashboardPage() {
  const totalAvailable = useMemo(
    () => CLUSTER.reduce((sum, company) => sum + company.available, 0),
    [],
  );
  const totalShared = useMemo(
    () => CLUSTER.reduce((sum, company) => sum + company.shared, 0),
    [],
  );
  const totalOutsourced = useMemo(
    () => CLUSTER.reduce((sum, company) => sum + company.outsourced, 0),
    [],
  );
  const totalRunning = useMemo(
    () => CLUSTER.reduce((sum, company) => sum + company.runningContainers, 0),
    [],
  );
  const totalDown = useMemo(
    () => CLUSTER.reduce((sum, company) => sum + company.downContainers, 0),
    [],
  );
  const avgSpeed = useMemo(
    () =>
      CLUSTER.reduce((sum, company) => sum + company.avgSpeed, 0) / CLUSTER.length,
    [],
  );

  const chartData = useMemo(
    () => ({
      labels: LABELS,
      datasets: [
        {
          label: "Peak demand %",
          data: CLUSTER.map((company) => company.peakDemand),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          fill: true,
          tension: 0.3,
          borderWidth: 2.5,
          pointRadius: 3,
        },
        {
          label: "Low demand %",
          data: CLUSTER.map((company) => company.lowDemand),
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14, 165, 233, 0.08)",
          fill: true,
          tension: 0.3,
          borderWidth: 2.2,
          pointRadius: 3,
        },
      ],
    }),
    [],
  );

  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#334155",
          },
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black tracking-tight text-blue-700">
            HETZNER
          </span>
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
            Admin Cluster Console
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
            Internal
          </span>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          Demo Mode: container simulation backend
        </span>
      </header>

      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <article className="card p-4">
            <p className="text-xs text-slate-500">Total compute available</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalAvailable} u</p>
          </article>
          <article className="card p-4">
            <p className="text-xs text-slate-500">Shared compute</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{totalShared} u</p>
          </article>
          <article className="card p-4">
            <p className="text-xs text-slate-500">Outsourced compute</p>
            <p className="mt-1 text-2xl font-bold text-sky-600">{totalOutsourced} u</p>
          </article>
          <article className="card p-4">
            <p className="text-xs text-slate-500">Average speed</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{avgSpeed.toFixed(1)} GHz</p>
          </article>
          <article className="card p-4">
            <p className="text-xs text-slate-500">Container health</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {totalRunning} up / {totalDown} down
            </p>
          </article>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
              Cluster Overview (4 companies)
            </h2>
            <span className="chip">Container cells</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {CLUSTER.map((company) => (
              <article key={company.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{company.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      company.downContainers > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {company.downContainers > 0 ? "Degraded" : "Healthy"}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-slate-600">
                      <span>Available</span>
                      <span>{company.available} u</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${company.available}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-slate-600">
                      <span>Shared</span>
                      <span>{company.shared} u</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${company.shared}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-slate-600">
                      <span>Outsourced</span>
                      <span>{company.outsourced} u</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-cyan-500"
                        style={{ width: `${company.outsourced}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700">
                    Running: <span className="font-semibold">{company.runningContainers}</span>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-700">
                    Down: <span className="font-semibold">{company.downContainers}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
          <article className="card space-y-3 p-5 sm:p-6">
            <div>
              <p className="text-base font-semibold text-slate-900">
                Peak vs Low Server Demand by Company
              </p>
              <p className="text-xs text-slate-500">
                Compare max and minimum utilization across each organization.
              </p>
            </div>
            <div className="h-72 rounded-xl border border-slate-200 bg-white p-3">
              <Line data={chartData} options={chartOptions} />
            </div>
          </article>

          <article className="card space-y-3 p-5 sm:p-6">
            <p className="text-base font-semibold text-slate-900">Server State Space</p>
            <p className="text-xs text-slate-500">
              Quick status matrix for simulated containers.
            </p>
            <div className="space-y-2">
              {CLUSTER.map((company) => (
                <div
                  key={`${company.id}-state`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between text-slate-700">
                    <span>{company.name}</span>
                    <span className="font-semibold">{company.runningContainers + company.downContainers} total</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{
                        width: `${(company.runningContainers / (company.runningContainers + company.downContainers)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
