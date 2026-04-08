# AI agent handoff: q-hack2026 (compressed context)

**Purpose:** Give another IDE/agent fast orientation on this repo and what was built.  
**Language:** English (project code/commits per team rules).  
**Generated:** 2026-04-09.  
**Sources:** Current codebase, `README.md`, `AGENTS.md`, and **Cursor agent transcripts** under this workspace’s project folder (not every chat in the universe—only sessions recorded there).

---

## 1. Stack and constraints

| Item | Value |
|------|--------|
| Framework | **Next.js 16.2.2** (App Router) — **not** classic Next.js; read `node_modules/next/dist/docs/` before assuming APIs |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Charts | Chart.js + react-chartjs-2 |
| TypeScript | Yes |
| Repo rule | `AGENTS.md` / `CLAUDE.md`: treat Next as version with breaking changes |

---

## 2. High-level product direction

- **Dashboard / trading-style UI** for server/compute load: buy/sell views, periods, metrics, charts (Hetzner-like blue theme was a reference).
- **“Sovereign compute”** backend in `backend/` (FastAPI gateway, Nomad, Docker) — see `backend/README.md` for architecture.
- **Landing / marketing:** `/home` with scroll animations and animated hero background (blobs), inspired in part by spherecast.ai-style motion.

---

## 3. Important routes and pages

| Path | Role |
|------|------|
| `/` (`src/app/page.tsx`) | Main dashboard: **Trading metrics** section, reusable GPU/CPU chart cards, header |
| `/home` | Marketing landing: hero, poster section, text blocks, Framer Motion |
| `/admin` | Admin layout with sidebar |
| `/base-layout` | Demo: `BaseLayout` + empty tall main (200% viewport height) for layout QA |

---

## 4. Key components (frontend)

- **`Header.tsx`** — Sticky header, search, user block, **sidebar toggle** (coordinates with layout).
- **`Footer.tsx`** — Slim footer component.
- **`BaseLayout.tsx`** — Shell: includes **header + sidebar + footer**; sidebar is part of base layout (not only header).
- **`WorkspaceSidebar.tsx`** / **`AdminSidebar.tsx`** — Sidebar variants; **`SideBarButton.tsx`** — list items (`buttonText`, `buttonAction`).
- **`SidebarToggleIcon.tsx`** — Toggle affordance; adjusted for desktop “sidebar always visible when wide enough” behavior on admin.
- **`ResourceUsageChart.tsx`** — Self-contained chart card: buy/sell, period (`7d`/`30d`/`90d`), own API fetch per instance.
- **`src/components/home/*`** — `HomeHero`, `HeroAnimatedBackground`, `AnimatedBlobField`, `HomePosterSection`, `HomeTextSection`, `MarketingHeader`, `AnimatedSection`, motion presets, blob layouts.

---

## 5. Libraries and data

- **`src/lib/usage-metrics.ts`** — Formulas: `Idle %`, `GPU Shared %`, `CPU Shared %` (clamped, safe for bad totals). Documented in root `README.md`.
- **`src/lib/chart-config.ts`** — Shared Chart.js styling/options.
- **`src/lib/compute-api.ts`** — Server-side proxy helpers to FastAPI; **`COMPUTE_API_BASE_URL`** in `.env.local` (no trailing slash issues handled). Returns 503 if unset.

### API routes (Next)

- `GET /api/trading-metrics?period=&resource=gpu|cpu` — Mock/time-series style data for charts (`src/app/api/trading-metrics/route.ts`).
- `src/app/api/compute/*` — Proxies to compute backend (`health`, `metrics`, `jobs/ai-demo`, etc.) when `COMPUTE_API_BASE_URL` is set.

### Mock / static data

- `public/mock/trading-metrics.json`
- `backend/mock_data/trading_metrics.json` (aligned with frontend mock usage)

---

## 6. What was done (from chat history — themes)

Sessions clustered by **topic** (user language was often German):

1. **Initial dashboard / Hetzner-style screen** — Blue theme layout from reference image; later stripped to **only trading-metrics main sections**; header with search re-added; removed various extra sections per screenshots.
2. **Trading metrics UX** — Sell/buy switch, period control, **no impossible “swells”** in chart semantics; **mock JSON** as if from API; **fetch per period** instead of fake per-second ticks.
3. **Charts refactor** — Migrated to **Chart.js**; light palette; then **removed old diagram**, kept new one; **two independent GPU/CPU charts** via reusable component; **Y-axis as percentages** using `usage-metrics`; **tooltips/help (?)** next to metrics with popover explanations; minor UI tweak (smaller `?` icon).
4. **Layout shell** — `Footer`; **`BaseLayout`** from sketch; `/base-layout` demo page; **Header** extracted from `page.tsx` to `Header.tsx`; sidebar toggle logic; **sidebar inside BaseLayout**; **`SideBarButton` + list API** for sidebar.
5. **Header/sidebar polish** — Align sidebar icon baseline with user block; **Spherecast-like** reference for `/home` plan.
6. **`/home` landing** — Scroll animations; user chose Framer options **1+2+6**; **animated blurred blob background** (speed/blur tweaks, light vs dark hero variants, visibility tuning).
7. **Admin** — Explained build; responsiveness; **sidebar visible on large screens**; floating toggle icon styling (flip strip, no heavy border/shadow); **sidebar component**, non-scrollable, **sticky while page scrolls**.
8. **Backend** — Explored `backend/`; mock folder; **integration plan** implemented; Next proxies; **port conflict**: Postgres on 8080 → API on **8082** (session note).
9. **Git** — User requested init/push to `github.com/AliRasikh/compute-share-on-premise` (verify remote state locally if needed).

---

## 7. Conventions for agents

- Prefer **existing components** and tokens; check `src/app` and `src/components` before adding parallel patterns.
- **Do not** assume training data matches Next 16 — consult local Next docs.
- **Env:** `.env.local` may contain `COMPUTE_API_BASE_URL`; never commit secrets.
- User preferences (from rules): PowerShell on Windows; **logical commits** with English messages; focused diffs.

---

## 8. Quick file index

```
src/app/page.tsx              # Main trading dashboard
src/app/home/                 # Landing route + client wrapper
src/app/admin/page.tsx        # Admin page
src/app/base-layout/page.tsx  # Layout demo
src/app/api/trading-metrics/  # Mock trading API
src/app/api/compute/          # Compute gateway proxies
src/components/Header.tsx, Footer.tsx, BaseLayout.tsx, ResourceUsageChart.tsx
src/lib/usage-metrics.ts, chart-config.ts, compute-api.ts
backend/                      # Sovereign compute stack + README
```

---

## 9. Gaps / follow-ups an agent might hit

- Trading charts use **Next API + mock JSON**; real backend fields may need alignment with `fetchComputeJson` metrics once wired end-to-end.
- **Git:** Workspace was reported as non-git at one point; confirm `git status` if versioning matters.
- Transcripts reference **plan files** the user asked not to edit; those plans may live outside this summary.

---

*End of handoff document. Re-scan `package.json` and `README.md` after major pulls.*
