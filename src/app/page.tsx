"use client";

import { useEffect, useState } from "react";
import { BaseLayout } from "@/components/BaseLayout";
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
  computeSource?: "live" | "mock";
  computeNote?: string;
};

type ComputeHealth = {
  status?: string;
  nomad?: { connected?: boolean };
};

type ComputeMetrics = {
  cluster?: {
    nodes?: { total?: number; ready?: number };
    cpu?: { percent?: number };
    memory?: { percent?: number };
    jobs?: { running?: number };
  };
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

  const [computeHealth, setComputeHealth] = useState<ComputeHealth | null>(null);
  const [computeHealthError, setComputeHealthError] = useState<string | null>(null);
  const [clusterMetrics, setClusterMetrics] = useState<ComputeMetrics | null>(null);
  const [clusterMetricsError, setClusterMetricsError] = useState<string | null>(null);
  const [aiDemoLoading, setAiDemoLoading] = useState(false);
  const [aiDemoMessage, setAiDemoMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadComputeStatus = async () => {
      setComputeHealthError(null);
      setClusterMetricsError(null);
      try {
        const [hRes, mRes] = await Promise.all([
          fetch("/api/compute/health"),
          fetch("/api/compute/metrics"),
        ]);
        if (hRes.ok) {
          setComputeHealth((await hRes.json()) as ComputeHealth);
        } else {
          const err = (await hRes.json().catch(() => ({}))) as { error?: string };
          setComputeHealth(null);
          setComputeHealthError(err.error ?? `Health HTTP ${hRes.status}`);
        }
        if (mRes.ok) {
          setClusterMetrics((await mRes.json()) as ComputeMetrics);
        } else {
          const err = (await mRes.json().catch(() => ({}))) as { error?: string };
          setClusterMetrics(null);
          setClusterMetricsError(err.error ?? `Metrics HTTP ${mRes.status}`);
        }
      } catch {
        setComputeHealth(null);
        setClusterMetrics(null);
        setComputeHealthError("Could not reach compute proxy.");
        setClusterMetricsError("Could not reach compute proxy.");
      }
    };

    void loadComputeStatus();
    const id = window.setInterval(loadComputeStatus, 30_000);
    return () => window.clearInterval(id);
  }, []);

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

  const runAiDemo = async () => {
    setAiDemoLoading(true);
    setAiDemoMessage(null);
    try {
      const res = await fetch("/api/compute/jobs/ai-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `ui-demo-${Date.now()}`,
          prompt: "Explain digital sovereignty in the EU (demo job from dashboard).",
          cpu: 500,
          memory: 512,
        }),
      });
      const payload = (await res.json()) as { job_id?: string; error?: string; detail?: string };
      if (!res.ok) {
        setAiDemoMessage(payload.error ?? payload.detail ?? `Request failed (${res.status})`);
        return;
      }
      setAiDemoMessage(
        payload.job_id ? `Job submitted: ${payload.job_id}` : "Job submitted.",
      );
    } catch {
      setAiDemoMessage("Could not submit demo job.");
    } finally {
      setAiDemoLoading(false);
    }
  };

  const healthLabel =
    computeHealth?.status === "healthy"
      ? "API healthy"
      : computeHealth?.status === "degraded"
        ? "API up (Nomad degraded)"
        : computeHealth
          ? computeHealth.status ?? "Unknown"
          : null;

  const nomadConnected = computeHealth?.nomad?.connected === true;

  return (
    <BaseLayout className="min-h-screen text-slate-900" mainClassName="space-y-8 p-4 sm:p-6 lg:p-8">
          <section className="space-y-2 pb-8">
            <h2 className="section-title">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
              Main Container
            </h2>
            <p className="text-sm text-slate-600">
              Trading metrics integrate with the compute API when{" "}
              <code className="rounded bg-slate-100 px-1">COMPUTE_API_BASE_URL</code> is set.
            </p>

            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">Compute backend</span>
                  {healthLabel ? (
                    <span
                      className={
                        computeHealth?.status === "healthy"
                          ? "rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
                          : computeHealth?.status === "degraded"
                            ? "rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900"
                            : "rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                      }
                    >
                      {healthLabel}
                    </span>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {computeHealthError ?? "Not loaded"}
                    </span>
                  )}
                  {nomadConnected ? (
                    <span className="text-xs text-emerald-700">Nomad connected</span>
                  ) : computeHealth ? (
                    <span className="text-xs text-amber-800">Nomad not connected</span>
                  ) : null}
                </div>
                {clusterMetrics?.cluster ? (
                  <p className="text-slate-600">
                    Nodes {clusterMetrics.cluster.nodes?.ready ?? "—"}/
                    {clusterMetrics.cluster.nodes?.total ?? "—"} ready · CPU{" "}
                    {clusterMetrics.cluster.cpu?.percent ?? "—"}% · RAM{" "}
                    {clusterMetrics.cluster.memory?.percent ?? "—"}% · Jobs running{" "}
                    {clusterMetrics.cluster.jobs?.running ?? "—"}
                  </p>
                ) : (
                  <p className="text-slate-500">
                    {clusterMetricsError ?? "Cluster metrics unavailable."}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void runAiDemo()}
                disabled={aiDemoLoading}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiDemoLoading ? "Submitting…" : "Run AI demo job"}
              </button>
            </div>
            {aiDemoMessage ? (
              <p className="text-sm text-slate-700" role="status">
                {aiDemoMessage}
              </p>
            ) : null}
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
          {gpuData?.computeNote ? (
            <p className="-mt-4 text-sm text-amber-800">{gpuData.computeNote}</p>
          ) : null}
          {gpuData?.computeSource ? (
            <p className="-mt-2 text-xs text-slate-500">
              Data source: {gpuData.computeSource === "live" ? "cluster snapshot" : "mock"}
            </p>
          ) : null}

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
          {cpuData?.computeSource ? (
            <p className="-mt-4 text-xs text-slate-500">
              Data source: {cpuData.computeSource === "live" ? "cluster snapshot" : "mock"}
            </p>
          ) : null}
    </BaseLayout>
  );
}
