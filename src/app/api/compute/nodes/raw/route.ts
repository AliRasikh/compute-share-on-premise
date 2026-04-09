import { NextRequest, NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

export async function GET(request: NextRequest) {
  const includeStats = request.nextUrl.searchParams.get("include_stats");
  const qs =
    includeStats === null
      ? ""
      : `?include_stats=${includeStats === "true" || includeStats === "1" ? "true" : "false"}`;

  const result = await fetchComputeJson<Record<string, unknown>>(
    `/api/v1/nodes/raw${qs}`,
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
