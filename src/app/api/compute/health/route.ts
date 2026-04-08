import { NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

type HealthUpstream = {
  status?: string;
  api?: { status?: string };
  nomad?: { connected?: boolean; [k: string]: unknown };
};

export async function GET() {
  const result = await fetchComputeJson<HealthUpstream>("/health", {
    method: "GET",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, configured: Boolean(process.env.COMPUTE_API_BASE_URL?.trim()) },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
