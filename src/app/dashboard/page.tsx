"use client";

import { useEffect, useState } from "react";
import { NetworkActivity } from "@/components/dashboard/NetworkActivity";
import { GlobalNodeMap } from "@/components/dashboard/GlobalNodeMap";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";

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

export default function DashboardPage() {
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





  const runAiDemo = async () => {
    setAiDemoLoading(true);
    setAiDemoMessage(null);
    try {
      const res = await fetch("/api/compute/jobs/ai-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `dashboard-ai-${Date.now()}`,
          prompt: "Analyze resource efficiency for green compute architectures.",
          cpu: 1000,
          memory: 1024,
        }),
      });
      const payload = (await res.json()) as { job_id?: string; error?: string; detail?: string };
      if (!res.ok) {
        setAiDemoMessage(payload.error ?? payload.detail ?? `Request failed (${res.status})`);
        return;
      }
      setAiDemoMessage(
        payload.job_id ? `Job submitted successfully: ${payload.job_id}` : "Job submitted.",
      );
    } catch {
      setAiDemoMessage("Could not submit demo job.");
    } finally {
      setAiDemoLoading(false);
    }
  };

  const isHealthy = computeHealth?.status === "healthy";
  const nodesReady = clusterMetrics?.cluster?.nodes?.ready ?? 0;
  const nodesTotal = clusterMetrics?.cluster?.nodes?.total ?? 0;

  const [showEuBanner, setShowEuBanner] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("eu-banner-dismissed") !== "true") {
      setShowEuBanner(true);
    }
  }, []);

  const dismissBanner = () => {
    setShowEuBanner(false);
    sessionStorage.setItem("eu-banner-dismissed", "true");
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* EU Sovereignty Info Banner */}
      {showEuBanner && (
        <div className="relative bg-emerald-50 border border-emerald-200 rounded-xl p-5 pr-12 shadow-sm">
          <button
            onClick={dismissBanner}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100 transition"
            aria-label="Close banner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="font-bold text-slate-900 text-[15px] mb-1">
            <span>🇪🇺</span> Help support European autonomy!
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Make sovereignty practical. Prefer European alternatives for everyday tools (docs, storage, messaging) — small switches add up.
          </p>
          <p className="text-sm text-slate-600 mt-1.5">
            Discover{" "}
            <a href="https://european-alternatives.eu/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold hover:underline">
              European alternatives for digital products
            </a>{" "}
            and{" "}
            <a href="https://www.goeuropean.org/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold hover:underline">
              European products and services
            </a>.
          </p>
        </div>
      )}

      {aiDemoMessage && (
        <div className="p-4 bg-slate-800 text-emerald-400 rounded-lg font-mono text-sm shadow-inner flex items-center gap-3">
          <span className="text-[#08dd9a]">{'>_'}</span>
          {aiDemoMessage}
        </div>
      )}

      {/* Global Node Map & Stats */}
      <div className="space-y-6">
        {/* <GlobalNodeMap /> */}
        <DashboardStatsCards />
      </div>



      {/* Network Activity Row */}
      <div className="mt-8">
        <NetworkActivity />
      </div>
    </div>
  );
}
