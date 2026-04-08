export type SharedUtilizationInput = {
  sharedGpu: number;
  totalGpuCapacity: number;
  sharedCpu: number;
  totalCpuCapacity: number;
};

export type IdleInput = {
  ownUsagePercent: number;
  sharedUsagePercent: number;
};

export type UsageMetrics = {
  idlePercent: number;
  gpuSharedPercent: number;
  cpuSharedPercent: number;
};

export type UsageChartSeries = {
  ownUsagePercentSeries: number[];
  sharedUsagePercentSeries: number[];
  idlePercentSeries: number[];
};

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const toPercent = (part: number, total: number): number => {
  if (total <= 0) return 0;
  return roundToTwo((part / total) * 100);
};

const clampPercent = (value: number): number =>
  roundToTwo(Math.min(100, Math.max(0, value)));

export function calculateUsagePercent(value: number, totalCapacity: number): number {
  return clampPercent(toPercent(value, totalCapacity));
}

export function calculateGpuSharedPercent(
  sharedGpu: number,
  totalGpuCapacity: number,
): number {
  return clampPercent(toPercent(sharedGpu, totalGpuCapacity));
}

export function calculateCpuSharedPercent(
  sharedCpu: number,
  totalCpuCapacity: number,
): number {
  return clampPercent(toPercent(sharedCpu, totalCpuCapacity));
}

export function calculateIdlePercent(
  ownUsagePercent: number,
  sharedUsagePercent: number,
): number {
  return clampPercent(100 - ownUsagePercent - sharedUsagePercent);
}

export function calculateUsageMetrics(
  sharedUtilization: SharedUtilizationInput,
  usage: IdleInput,
): UsageMetrics {
  const gpuSharedPercent = calculateGpuSharedPercent(
    sharedUtilization.sharedGpu,
    sharedUtilization.totalGpuCapacity,
  );
  const cpuSharedPercent = calculateCpuSharedPercent(
    sharedUtilization.sharedCpu,
    sharedUtilization.totalCpuCapacity,
  );
  const idlePercent = calculateIdlePercent(
    usage.ownUsagePercent,
    usage.sharedUsagePercent,
  );

  return {
    idlePercent,
    gpuSharedPercent,
    cpuSharedPercent,
  };
}

export function buildUsageChartSeries(
  ownSeries: number[],
  sharedSeries: number[],
): UsageChartSeries {
  const seriesLength = Math.min(ownSeries.length, sharedSeries.length);
  const pairedSeries = Array.from({ length: seriesLength }, (_, index) => ({
    own: ownSeries[index] ?? 0,
    shared: sharedSeries[index] ?? 0,
  }));

  const totalCapacity = Math.max(
    1,
    ...pairedSeries.map((point) => point.own + point.shared),
  );

  const ownUsagePercentSeries = pairedSeries.map((point) =>
    calculateUsagePercent(point.own, totalCapacity),
  );
  const sharedUsagePercentSeries = pairedSeries.map((point) =>
    calculateUsagePercent(point.shared, totalCapacity),
  );
  const idlePercentSeries = pairedSeries.map((_, index) =>
    calculateIdlePercent(
      ownUsagePercentSeries[index] ?? 0,
      sharedUsagePercentSeries[index] ?? 0,
    ),
  );

  return {
    ownUsagePercentSeries,
    sharedUsagePercentSeries,
    idlePercentSeries,
  };
}
