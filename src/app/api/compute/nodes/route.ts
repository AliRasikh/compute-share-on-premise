import { NextRequest, NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();
  const path = qs ? `/api/v1/nodes?${qs}` : "/api/v1/nodes";

  const result = await fetchComputeJson<Record<string, unknown>>(path, { method: "GET" });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, configured: Boolean(process.env.COMPUTE_API_BASE_URL?.trim()) },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
