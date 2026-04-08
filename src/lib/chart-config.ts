import type { ChartOptions } from "chart.js";

type BuildLineChartOptionsInput = {
  unitLabel: string;
};

export function buildLineChartOptions({
  unitLabel,
}: BuildLineChartOptionsInput): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 850,
      easing: "easeOutQuart",
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#0f172a",
        bodyColor: "#334155",
        borderColor: "#cbd5e1",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return ` ${value.toFixed(0)} ${unitLabel}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          maxRotation: 0,
        },
        border: {
          color: "#e2e8f0",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#e2e8f0",
        },
        ticks: {
          color: "#64748b",
        },
        border: {
          color: "#e2e8f0",
        },
      },
    },
  };
}
