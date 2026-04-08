"use client";

import { useEffect, useMemo, useState } from "react";

type ServerPlan = {
  id: string;
  name: string;
  vcpus: number;
  ram: string;
  ssd: string;
  traffic: string;
  priceHour: number;
  priceMonth: number;
};

const serverPlans: ServerPlan[] = [
  {
    id: "cax11",
    name: "CAX11",
    vcpus: 2,
    ram: "4 GB",
    ssd: "40 GB",
    traffic: "20 TB",
    priceHour: 0.005,
    priceMonth: 3.29,
  },
  {
    id: "cax21",
    name: "CAX21",
    vcpus: 4,
    ram: "8 GB",
    ssd: "80 GB",
    traffic: "20 TB",
    priceHour: 0.01,
    priceMonth: 5.99,
  },
  {
    id: "cax31",
    name: "CAX31",
    vcpus: 8,
    ram: "16 GB",
    ssd: "160 GB",
    traffic: "20 TB",
    priceHour: 0.019,
    priceMonth: 11.99,
  },
  {
    id: "cax41",
    name: "CAX41",
    vcpus: 16,
    ram: "32 GB",
    ssd: "320 GB",
    traffic: "20 TB",
    priceHour: 0.038,
    priceMonth: 23.99,
  },
];

const optionalServices = [
  { id: "volumes", label: "Volumes", monthly: 0.0 },
  { id: "firewalls", label: "Firewalls", monthly: 0.0 },
  { id: "backups", label: "Backups", monthly: 0.99 },
] as const;

export default function Home() {
  const [instanceType, setInstanceType] = useState<"shared" | "dedicated">(
    "shared",
  );
  const [architecture, setArchitecture] = useState<"x86" | "arm64">("arm64");
  const [selectedPlanId, setSelectedPlanId] = useState("cax11");
  const [selectedServices, setSelectedServices] = useState<
    Record<(typeof optionalServices)[number]["id"], boolean>
  >({
    volumes: false,
    firewalls: false,
    backups: false,
  });
  const [tradingMode, setTradingMode] = useState<"idle" | "buy" | "sell">(
    "idle",
  );
  const [buyLoad, setBuyLoad] = useState(0);
  const [sellLoad, setSellLoad] = useState(0);
  const [marketPricePerUnit, setMarketPricePerUnit] = useState(1.18);

  const selectedPlan =
    serverPlans.find((plan) => plan.id === selectedPlanId) ?? serverPlans[0];

  const ipv4Monthly = 0.5;
  const optionalMonthly = useMemo(
    () =>
      optionalServices.reduce(
        (total, service) =>
          selectedServices[service.id] ? total + service.monthly : total,
        0,
      ),
    [selectedServices],
  );
  const totalMonthly = selectedPlan.priceMonth + ipv4Monthly + optionalMonthly;
  const currentEarnings = useMemo(
    () => (tradingMode === "sell" ? sellLoad * marketPricePerUnit : 0),
    [tradingMode, sellLoad, marketPricePerUnit],
  );

  const toggleService = (serviceId: (typeof optionalServices)[number]["id"]) => {
    setSelectedServices((current) => ({
      ...current,
      [serviceId]: !current[serviceId],
    }));
  };

  const setMode = (mode: "idle" | "buy" | "sell") => {
    setTradingMode(mode);
    if (mode === "buy") {
      setSellLoad(0);
    }
    if (mode === "sell") {
      setBuyLoad(0);
    }
    if (mode === "idle") {
      setBuyLoad(0);
      setSellLoad(0);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketPricePerUnit((current) => {
        const delta = (Math.random() - 0.5) * 0.08;
        return Math.min(2.2, Math.max(0.4, current + delta));
      });

      if (tradingMode === "buy") {
        setBuyLoad((current) => Math.min(100, Math.max(5, current + 2)));
      }

      if (tradingMode === "sell") {
        setSellLoad((current) => Math.min(100, Math.max(5, current + 2)));
      }
    }, 1800);

    return () => clearInterval(timer);
  }, [tradingMode]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black tracking-tight text-blue-700">
            HETZNER
          </span>
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
            Cloud Console
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
            Arm64
          </span>
        </div>
        <div className="flex w-full max-w-xl items-center gap-4">
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Search..."
            aria-label="Search"
          />
          <button className="rounded-md border border-slate-200 bg-white p-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            🔔
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[72px_1fr_320px]">
        <aside className="hidden border-r border-slate-200 bg-white xl:block">
          <nav className="flex h-full flex-col items-center gap-4 py-4">
            {["≡", "⌂", "☁", "🖥", "🔒", "⚙"].map((item) => (
              <button
                key={item}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="space-y-8 p-4 sm:p-6 lg:p-8">
          <section className="space-y-4">
            <h2 className="section-title">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
              Type
            </h2>

            <div className="grid gap-4 lg:grid-cols-2">
              <button
                onClick={() => setInstanceType("shared")}
                className={`card p-6 text-left transition ${
                  instanceType === "shared"
                    ? "border-blue-500 bg-blue-50/70"
                    : "hover:border-blue-200"
                }`}
              >
                <p className="text-xl font-semibold">Shared vCPU</p>
                <p className="mt-2 text-sm text-slate-600">
                  Ideal for individual applications, distributed systems and
                  dynamic clusters.
                </p>
              </button>
              <button
                onClick={() => setInstanceType("dedicated")}
                className={`card p-6 text-left transition ${
                  instanceType === "dedicated"
                    ? "border-blue-500 bg-blue-50/70"
                    : "hover:border-blue-200"
                }`}
              >
                <p className="text-xl font-semibold">Dedicated vCPU</p>
                <p className="mt-2 text-sm text-slate-600">
                  Maximum performance with dedicated cores for CPU intensive
                  applications.
                </p>
              </button>
            </div>

            <div className="card p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                ARCHITECTURE
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  onClick={() => setArchitecture("x86")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    architecture === "x86"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  x86 (Intel/AMD)
                </button>
                <button
                  onClick={() => setArchitecture("arm64")}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    architecture === "arm64"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  Arm64 (Ampere) <span className="chip">NEW</span>
                </button>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold tracking-wide text-slate-500">
                <span>NAME</span>
                <span>VCPUS</span>
                <span>RAM</span>
                <span>SSD</span>
                <span>TRAFFIC</span>
                <span>PRICE / H</span>
                <span>PRICE</span>
              </div>
              <div className="space-y-2 p-3">
                {serverPlans.map((plan) => {
                  const isActive = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`grid w-full grid-cols-7 items-center rounded-xl border px-3 py-3 text-left text-sm transition ${
                        isActive
                          ? "row-active"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span
                          className={`h-3 w-3 rounded-full border ${
                            isActive
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                        {plan.name}
                        {plan.id === "cax11" && <span className="chip">NEW</span>}
                      </span>
                      <span>{plan.vcpus}</span>
                      <span>{plan.ram}</span>
                      <span>{plan.ssd}</span>
                      <span>{plan.traffic}</span>
                      <span>€{plan.priceHour.toFixed(3)}/h</span>
                      <span className="font-semibold text-blue-700">
                        €{plan.priceMonth.toFixed(2)}
                        <span className="text-xs text-slate-500">/mo</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-3 pb-8">
            <h2 className="section-title">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
              Networking
            </h2>
            <div className="card p-5 text-sm text-slate-600">
              Enable public or private networking for your selected instance.
              You can assign additional IP ranges and options in the next step.
            </div>
          </section>
        </main>

        <aside className="border-l border-slate-200 bg-white p-4 sm:p-6 xl:sticky xl:top-0 xl:h-[calc(100vh-4rem)]">
          <div className="space-y-4">
            <div className="card divide-y divide-slate-100 overflow-hidden">
              <div className="space-y-1 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Falkenstein</p>
                <p className="text-xs text-slate-500">Location</p>
              </div>
              <div className="space-y-1 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Ubuntu 20.04</p>
                <p className="text-xs text-slate-500">Image</p>
              </div>
              <div className="space-y-1 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {selectedPlan.name}
                </p>
                <p className="text-xs text-slate-500">Type</p>
              </div>
              <div className="space-y-1 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">IPv4, IPv6</p>
                <p className="text-xs text-slate-500">Networking</p>
              </div>
              <div className="space-y-1 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">1 key</p>
                <p className="text-xs text-slate-500">SSH keys</p>
              </div>
            </div>

            <div className="card p-4">
              <div className="space-y-2">
                {optionalServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-700">{service.label}</span>
                    <input
                      type="checkbox"
                      checked={selectedServices[service.id]}
                      onChange={() => toggleService(service.id)}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Trading Metrics
                  </p>
                  <span className="text-xs text-slate-500">
                    Mode: {tradingMode.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMode("buy")}
                    disabled={tradingMode === "sell"}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      tradingMode === "buy"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-700 hover:border-blue-300"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setMode("sell")}
                    disabled={tradingMode === "buy"}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      tradingMode === "sell"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-700 hover:border-blue-300"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Sell
                  </button>
                  <button
                    onClick={() => setMode("idle")}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      tradingMode === "idle"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    Idle
                  </button>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Server load sold</span>
                    <span className="font-semibold">{sellLoad.toFixed(0)} u</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Server load bought</span>
                    <span className="font-semibold">{buyLoad.toFixed(0)} u</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Market price / unit</span>
                    <span className="font-semibold">
                      €{marketPricePerUnit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="font-medium text-slate-700">
                      Current earnings
                    </span>
                    <span className="font-semibold text-blue-700">
                      €{currentEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Buy and sell are exclusive. Activating one disables the other.
                </p>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
