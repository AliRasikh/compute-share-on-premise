import { NextResponse } from "next/server";
import { getComputeApiBaseUrl } from "@/lib/compute-api";

const DEFAULT_TIMEOUT_MS = 30_000;

export async function POST(request: Request) {
  const base = getComputeApiBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: "COMPUTE_API_BASE_URL is not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/api/v1/jobs/ai-demo`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });

    const text = await res.text();
    let payload: unknown;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (!res.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof (payload as { detail: unknown }).detail === "string"
          ? (payload as { detail: string }).detail
          : res.statusText;
      return NextResponse.json(
        { error: message || `Upstream ${res.status}` },
        { status: res.status === 502 ? 503 : res.status },
      );
    }

    return NextResponse.json(payload);
  } catch (e) {
    const message =
      e instanceof Error && e.name === "AbortError"
        ? "Compute API request timed out"
        : e instanceof Error
          ? e.message
          : "Failed to reach compute API";
    return NextResponse.json({ error: message }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
