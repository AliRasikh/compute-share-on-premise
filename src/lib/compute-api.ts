/**
 * Server-side helpers for the Sovereign Compute Engine FastAPI gateway.
 * Set COMPUTE_API_BASE_URL (e.g. http://127.0.0.1:8080) in .env.local.
 */

const DEFAULT_TIMEOUT_MS = 12_000;

export function getComputeApiBaseUrl(): string | null {
  const raw = process.env.COMPUTE_API_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export type ComputeProxyError = {
  ok: false;
  status: number;
  message: string;
};

export type ComputeProxyOk<T> = { ok: true; data: T };

export async function fetchComputeJson<T>(
  path: string,
  init?: RequestInit,
): Promise<ComputeProxyOk<T> | ComputeProxyError> {
  const base = getComputeApiBaseUrl();
  if (!base) {
    return {
      ok: false,
      status: 503,
      message: "COMPUTE_API_BASE_URL is not configured",
    };
  }

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers as Record<string, string>),
      },
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const errBody = (await res.json()) as { detail?: unknown };
        if (typeof errBody.detail === "string") detail = errBody.detail;
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        status: res.status === 502 ? 503 : res.status,
        message: detail || `Upstream returned ${res.status}`,
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    const message =
      e instanceof Error && e.name === "AbortError"
        ? "Compute API request timed out"
        : e instanceof Error
          ? e.message
          : "Failed to reach compute API";
    return { ok: false, status: 503, message };
  } finally {
    clearTimeout(timeout);
  }
}
