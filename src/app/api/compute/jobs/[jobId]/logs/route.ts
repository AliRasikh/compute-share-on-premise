import { NextResponse } from "next/server";
import { fetchComputeJson } from "@/lib/compute-api";

type LogsResponse = {
  job_id: string;
  alloc_id: string;
  task: string;
  node: string;
  status: string;
  output: string;
  stderr: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const result = await fetchComputeJson<LogsResponse>(
    `/api/v1/jobs/${jobId}/logs`,
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
