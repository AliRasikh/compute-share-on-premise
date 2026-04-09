import { NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

type StopJobResponse = {
  message: string;
  eval_id?: string;
  purged: boolean;
};

/**
 * Stop and purge a Nomad job (queued or running). Proxies to DELETE /api/v1/jobs/{id}?purge=true.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const result = await fetchComputeJson<StopJobResponse>(
    `/api/v1/jobs/${encodeURIComponent(jobId)}?purge=true`,
    { method: "DELETE" },
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
