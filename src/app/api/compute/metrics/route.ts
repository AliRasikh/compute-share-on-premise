import { NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

export async function GET() {
  const result = await fetchComputeJson<Record<string, unknown>>(
    "/api/v1/metrics",
    { method: "GET" },
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, configured: Boolean(process.env.COMPUTE_API_BASE_URL?.trim()) },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
