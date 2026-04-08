This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Usage Metrics Formulas

Project utility functions for usage metrics are in `src/lib/usage-metrics.ts`.

Implemented formulas:

- `Idle % = 100 - Own Usage % - Shared Usage %`
- `GPU Shared % = (Shared GPU / Total GPU Capacity) * 100`
- `CPU Shared % = (Shared CPU / Total CPU Capacity) * 100`

The utility includes safe handling for invalid totals (`<= 0`) and clamps results to `0..100`.

Example:

```ts
import { calculateUsageMetrics } from "@/lib/usage-metrics";

const metrics = calculateUsageMetrics(
  {
    sharedGpu: 42,
    totalGpuCapacity: 100,
    sharedCpu: 35,
    totalCpuCapacity: 80,
  },
  {
    ownUsagePercent: 45,
    sharedUsagePercent: 30,
  },
);
```

## Reusable GPU/CPU Charts

The UI now uses a reusable chart card component at `src/components/ResourceUsageChart.tsx`.

- Each chart instance is fully independent (state and API calls are not shared).
- Every card has its own:
  - buy/sell switch
  - period switch (`7d`, `30d`, `90d`)
  - chart and summary metrics

Shared chart configuration is in `src/lib/chart-config.ts`.

API endpoint `src/app/api/trading-metrics/route.ts` now provides resource-specific data:

- `GET /api/trading-metrics?period=30d&resource=gpu`
- `GET /api/trading-metrics?period=30d&resource=cpu`
