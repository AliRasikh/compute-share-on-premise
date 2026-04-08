import { readFileSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

type PeriodKey = "7d" | "30d" | "90d";
type ResourceKey = "gpu" | "cpu";

type ResourceSeries = {
  labels: string[];
  buy: number[];
  sell: number[];
  marketPrice: number[];
};

/**
 * Live mapping (Stufe A from integration plan):
 * - Backend returns a single snapshot (GET /api/v1/metrics), not historical trading data.
 * - CPU: buy series ≈ cluster CPU used MHz, sell ≈ available MHz, repeated across the
 *   chart length with small sinusoidal jitter so lines are readable (not a flat line).
 * - GPU: no GPU utilization in the API. We aggregate CPU used/total on nodes where
 *   gpu_type !== "none" as a demo stand-in; if there are no such nodes, we fall back to mock data.
 */
type ClusterMetricsPayload = {
  cluster: {
    cpu: {
      total_mhz: number;
      used_mhz: number;
      available_mhz: number;
      percent: number;
    };
    memory: {
      total_mb: number;
      used_mb: number;
      available_mb: number;
      percent: number;
    };
  };
  nodes: Array<{
    gpu_type?: string;
    cpu: {
      total_mhz: number;
      used_mhz: number;
      percent: number;
    };
  }>;
};

/** Mock trading series for GPU/CPU charts; edit `backend/mock_data/trading_metrics.json`. */
const MOCK_DATA_PATH = path.join(
  process.cwd(),
  "backend",
  "mock_data",
  "trading_metrics.json",
);

const DATA: Record<
  PeriodKey,
  {
    gpu: ResourceSeries;
    cpu: ResourceSeries;
  }
> = JSON.parse(readFileSync(MOCK_DATA_PATH, "utf-8")) as Record<
  PeriodKey,
  { gpu: ResourceSeries; cpu: ResourceSeries }
>;

function spreadSnapshotScalar(value: number, length: number): number[] {
  if (length <= 0) return [];
  return Array.from({ length }, (_, i) => {
    const t = length > 1 ? i / (length - 1) : 0;
    const jitter = 1 + 0.012 * Math.sin(t * Math.PI * 2);
    return Math.max(0, Math.round(value * jitter));
  });
}

function spreadSnapshotPrice(value: number, length: number, decimals = 2): number[] {
  if (length <= 0) return [];
  return Array.from({ length }, (_, i) => {
    const t = length > 1 ? i / (length - 1) : 0;
    const jitter = 1 + 0.008 * Math.cos(t * Math.PI * 2);
    const v = Math.min(99, Math.max(0, value * jitter));
    return Math.round(v * 10 ** decimals) / 10 ** decimals;
  });
}

function buildLiveCpuSeries(
  cluster: ClusterMetricsPayload,
  template: ResourceSeries,
): ResourceSeries {
  const n = template.labels.length;
  const { used_mhz, available_mhz, percent } = cluster.cluster.cpu;
  return {
    labels: template.labels,
    buy: spreadSnapshotScalar(used_mhz, n),
    sell: spreadSnapshotScalar(available_mhz, n),
    marketPrice: spreadSnapshotPrice(0.32 + (percent / 100) * 0.28, n),
  };
}

function buildLiveGpuSeries(
  cluster: ClusterMetricsPayload,
  template: ResourceSeries,
): ResourceSeries | null {
  const gpuNodes = cluster.nodes.filter(
    (n) => n.gpu_type && n.gpu_type !== "none",
  );
  if (gpuNodes.length === 0) return null;

  const used = gpuNodes.reduce((s, n) => s + n.cpu.used_mhz, 0);
  const total = gpuNodes.reduce((s, n) => s + n.cpu.total_mhz, 0);
  const available = Math.max(0, total - used);
  const avgPct =
    gpuNodes.reduce((s, n) => s + n.cpu.percent, 0) / gpuNodes.length;

  const n = template.labels.length;
  return {
    labels: template.labels,
    buy: spreadSnapshotScalar(used, n),
    sell: spreadSnapshotScalar(available, n),
    marketPrice: spreadSnapshotPrice(0.65 + (avgPct / 100) * 0.55, n),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") as PeriodKey | null;
  const resource = searchParams.get("resource") as ResourceKey | null;
  const selectedPeriod: PeriodKey = period && DATA[period] ? period : "30d";
  const selectedResource: ResourceKey =
    resource === "gpu" || resource === "cpu" ? resource : "gpu";

  const mockBlock = DATA[selectedPeriod];
  const mockSeries = mockBlock[selectedResource];

  let computeSource: "live" | "mock" = "mock";
  let computeNote: string | undefined;

  const live = await fetchComputeJson<ClusterMetricsPayload>("/api/v1/metrics", {
    method: "GET",
  });

  let labels = mockSeries.labels;
  let buy = mockSeries.buy;
  let sell = mockSeries.sell;
  let marketPrice = mockSeries.marketPrice;

  if (live.ok && live.data.cluster?.cpu) {
    try {
      if (selectedResource === "cpu") {
        const series = buildLiveCpuSeries(live.data, mockBlock.cpu);
        labels = series.labels;
        buy = series.buy;
        sell = series.sell;
        marketPrice = series.marketPrice;
        computeSource = "live";
      } else {
        const gpuLive = buildLiveGpuSeries(live.data, mockBlock.gpu);
        if (gpuLive) {
          labels = gpuLive.labels;
          buy = gpuLive.buy;
          sell = gpuLive.sell;
          marketPrice = gpuLive.marketPrice;
          computeSource = "live";
        } else {
          computeNote =
            "GPU chart uses mock series: no nodes with gpu_type other than none in the cluster snapshot.";
        }
      }
    } catch {
      computeNote = "Live mapping failed; showing mock trading series.";
    }
  }

  return NextResponse.json({
    currency: "EUR",
    unit: "u",
    updatedAt: new Date().toISOString(),
    period: selectedPeriod,
    resource: selectedResource,
    labels,
    buy,
    sell,
    marketPrice,
    resources: DATA[selectedPeriod],
    computeSource,
    ...(computeNote ? { computeNote } : {}),
  });
}
