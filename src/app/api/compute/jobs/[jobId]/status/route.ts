import { NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

type JobStatusResponse = {
  job_id: string;
  job_status: string;
  alloc_status: string;
  node: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const result = await fetchComputeJson<JobStatusResponse>(
    `/api/v1/jobs/${jobId}/status`,
    { method: "GET" },
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
}
