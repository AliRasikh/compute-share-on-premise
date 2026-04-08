import { NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchComputeJson<unknown>("/api/v1/jobs", {
    method: "GET",
    // Ensure we don't cache deeply if we want real-time job status
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, configured: Boolean(process.env.COMPUTE_API_BASE_URL?.trim()) },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
