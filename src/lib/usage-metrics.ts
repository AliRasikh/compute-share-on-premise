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

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const toPercent = (part: number, total: number): number => {
  if (total <= 0) return 0;
  return roundToTwo((part / total) * 100);
};

const clampPercent = (value: number): number =>
  roundToTwo(Math.min(100, Math.max(0, value)));

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
