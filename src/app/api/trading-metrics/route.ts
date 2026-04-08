import { NextResponse } from "next/server";

type PeriodKey = "7d" | "30d" | "90d";
type ResourceKey = "gpu" | "cpu";

type ResourceSeries = {
  labels: string[];
  buy: number[];
  sell: number[];
  marketPrice: number[];
};

const DATA: Record<
  PeriodKey,
  {
    gpu: ResourceSeries;
    cpu: ResourceSeries;
  }
> = {
  "7d": {
    gpu: {
      labels: ["Apr 02", "Apr 03", "Apr 04", "Apr 05", "Apr 06", "Apr 07", "Apr 08"],
      buy: [4200, 5200, 6400, 7900, 9100, 10400, 12100],
      sell: [5100, 6400, 7900, 9800, 11600, 13800, 15600],
      marketPrice: [0.88, 0.91, 0.95, 1.02, 1.08, 1.14, 1.2],
    },
    cpu: {
      labels: ["Apr 02", "Apr 03", "Apr 04", "Apr 05", "Apr 06", "Apr 07", "Apr 08"],
      buy: [1900, 2500, 3200, 3800, 4400, 5100, 5700],
      sell: [2400, 3000, 3700, 4400, 5200, 5900, 6700],
      marketPrice: [0.41, 0.42, 0.44, 0.45, 0.46, 0.48, 0.49],
    },
  },
  "30d": {
    gpu: {
      labels: [
        "Mar 10",
        "Mar 12",
        "Mar 14",
        "Mar 16",
        "Mar 18",
        "Mar 20",
        "Mar 22",
        "Mar 24",
        "Mar 26",
        "Mar 28",
        "Mar 30",
        "Apr 01",
        "Apr 03",
        "Apr 05",
        "Apr 07",
      ],
      buy: [6000, 7400, 8900, 10200, 11700, 13300, 14900, 16600, 18200, 19700, 21300, 22800, 24500, 26200, 27900],
      sell: [7100, 8800, 10600, 12300, 14100, 16000, 17900, 19900, 22000, 24200, 26400, 28700, 31000, 33300, 35800],
      marketPrice: [0.84, 0.86, 0.88, 0.9, 0.93, 0.95, 0.98, 1.01, 1.03, 1.06, 1.08, 1.11, 1.14, 1.17, 1.2],
    },
    cpu: {
      labels: [
        "Mar 10",
        "Mar 12",
        "Mar 14",
        "Mar 16",
        "Mar 18",
        "Mar 20",
        "Mar 22",
        "Mar 24",
        "Mar 26",
        "Mar 28",
        "Mar 30",
        "Apr 01",
        "Apr 03",
        "Apr 05",
        "Apr 07",
      ],
      buy: [3200, 3900, 4600, 5200, 6100, 6900, 7600, 8400, 9200, 9900, 10700, 11500, 12300, 13100, 14000],
      sell: [3800, 4500, 5300, 6200, 7100, 7900, 8800, 9700, 10600, 11500, 12400, 13300, 14300, 15300, 16400],
      marketPrice: [0.39, 0.4, 0.41, 0.42, 0.43, 0.44, 0.45, 0.46, 0.47, 0.48, 0.49, 0.5, 0.51, 0.52, 0.53],
    },
  },
  "90d": {
    gpu: {
      labels: [
        "Jan 08",
        "Jan 15",
        "Jan 22",
        "Jan 29",
        "Feb 05",
        "Feb 12",
        "Feb 19",
        "Feb 26",
        "Mar 04",
        "Mar 11",
        "Mar 18",
        "Mar 25",
        "Apr 01",
        "Apr 04",
        "Apr 08",
      ],
      buy: [9000, 12000, 15400, 18800, 22600, 26400, 30600, 34900, 39400, 44100, 48900, 54000, 59300, 64800, 70500],
      sell: [11000, 14900, 19000, 23400, 28100, 33100, 38300, 43800, 49500, 55400, 61600, 68100, 74900, 82000, 89400],
      marketPrice: [0.72, 0.74, 0.77, 0.8, 0.83, 0.86, 0.9, 0.94, 0.98, 1.02, 1.06, 1.1, 1.14, 1.17, 1.2],
    },
    cpu: {
      labels: [
        "Jan 08",
        "Jan 15",
        "Jan 22",
        "Jan 29",
        "Feb 05",
        "Feb 12",
        "Feb 19",
        "Feb 26",
        "Mar 04",
        "Mar 11",
        "Mar 18",
        "Mar 25",
        "Apr 01",
        "Apr 04",
        "Apr 08",
      ],
      buy: [4700, 6200, 7900, 9700, 11600, 13600, 15700, 17900, 20200, 22600, 25100, 27700, 30400, 33200, 36100],
      sell: [5500, 7300, 9300, 11400, 13600, 15900, 18300, 20800, 23400, 26100, 28900, 31800, 34800, 37900, 41100],
      marketPrice: [0.35, 0.36, 0.37, 0.39, 0.4, 0.42, 0.43, 0.45, 0.47, 0.49, 0.5, 0.52, 0.54, 0.56, 0.58],
    },
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") as PeriodKey | null;
  const resource = searchParams.get("resource") as ResourceKey | null;
  const selectedPeriod: PeriodKey = period && DATA[period] ? period : "30d";
  const selectedResource: ResourceKey =
    resource === "gpu" || resource === "cpu" ? resource : "gpu";
  const selectedResourceData = DATA[selectedPeriod][selectedResource];

  return NextResponse.json({
    currency: "EUR",
    unit: "u",
    updatedAt: new Date().toISOString(),
    period: selectedPeriod,
    resource: selectedResource,
    labels: selectedResourceData.labels,
    buy: selectedResourceData.buy,
    sell: selectedResourceData.sell,
    marketPrice: selectedResourceData.marketPrice,
    resources: DATA[selectedPeriod],
  });
}
