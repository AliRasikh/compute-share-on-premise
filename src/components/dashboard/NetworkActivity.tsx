"use client";

import React, { useEffect, useState } from "react";

type ActivityItem = {
  id: string;
  type: "complete" | "running" | "pending" | "dead" | string;
  title: React.ReactNode;
  subtitle: string;
};

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "complete",
    title: (
      <span>
        Node <strong className="font-semibold text-slate-800">alpha-9</strong> earned{" "}
        <span className="text-[#08dd9a]">$0.04</span>
      </span>
    ),
    subtitle: "2 mins ago • Micro-transaction processed",
  },
  {
    id: "2",
    type: "running",
    title: (
      <span>
        Job <strong className="font-semibold text-slate-800">xyz-123</strong> provisioned
      </span>
    ),
    subtitle: "15 mins ago • 16 Cores allocated",
  },
];

export function NetworkActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/compute/jobs");
        if (res.ok) {
          const data = await res.json();
          if (data && data.jobs) {
            const transformed: ActivityItem[] = data.jobs
              .sort((a: any, b: any) => Number(b.create_time || 0) - Number(a.create_time || 0))
              .slice(0, 5)
              .map((job: any) => {
                const jsTime = Number(job.create_time) / 1000000;
                const diffMins = Math.floor((Date.now() - jsTime) / 60000);
                const timeStr =
                  diffMins < 1
                    ? "Just now"
                    : diffMins < 60
                      ? `${diffMins} min${diffMins > 1 ? "s" : ""} ago`
                      : `${Math.floor(diffMins / 60)} hr${Math.floor(diffMins / 60) > 1 ? "s" : ""} ago`;

                let subtitle = `${timeStr} • ${job.meta?.workload_type || job.type || "Compute Job"}`;
                
                let finalStatus = job.status;

                // Nomad marks finished batch jobs as "dead" even if successful.
                // We inspect task_groups to verify if it completed successfully vs failed.
                if (finalStatus === "dead" && job.task_groups) {
                  let hasComplete = false;
                  let hasFailed = false;
                  for (const tg of Object.values<any>(job.task_groups)) {
                    if (tg.complete > 0) hasComplete = true;
                    if (tg.failed > 0) hasFailed = true;
                  }
                  
                  if (hasComplete && !hasFailed) {
                    finalStatus = "complete";
                  }
                }

                // Construct nicely formatted titles based on status
                let titleNodes = (
                  <span>
                    Job <strong className="font-semibold text-slate-800">{job.name}</strong> was submitted
                  </span>
                );

                if (finalStatus === "complete") {
                  titleNodes = (
                    <span>
                      Job <strong className="font-semibold text-slate-800">{job.name}</strong> successfully completed
                      <span className="text-[#08dd9a] ml-1">✓</span>
                    </span>
                  );
                } else if (finalStatus === "running") {
                  titleNodes = (
                    <span>
                      Job <strong className="font-semibold text-slate-800">{job.name}</strong> is currently executing
                    </span>
                  );
                } else if (finalStatus === "dead") {
                  titleNodes = (
                    <span>
                      Job <strong className="font-semibold text-slate-800">{job.name}</strong> failed or stopped
                    </span>
                  );
                }

                return {
                  id: job.id,
                  type: finalStatus,
                  title: titleNodes,
                  subtitle,
                };
              });

            if (transformed.length > 0) {
              setActivities(transformed);
            }
          }
        }
      } catch (err) {
        // silently ignore fetch errors to leave standard/mock UI up
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
    const interval = setInterval(fetchJobs, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg tracking-tight text-slate-800">Network Activity {loading && <span className="ml-2 text-xs text-slate-400 font-normal">Syncing...</span>}</h3>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {activities.length === 0 ? (
           <div className="p-8 text-center text-slate-500 text-sm">No recent network activity on the cluster.</div>
        ) : (
          <ul className="divide-y divide-slate-100 flex-1">
            {activities.map((activity) => {
              let icon;
              let iconBg;
              let iconColor;
              
              if (activity.type === "complete") {
                icon = (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                );
                iconBg = "bg-emerald-50";
                iconColor = "text-[#08dd9a]";
              } else if (activity.type === "running") {
                icon = (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                );
                iconBg = "bg-blue-50";
                iconColor = "text-blue-500";
              } else if (activity.type === "dead") {
                icon = (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                );
                iconBg = "bg-rose-50";
                iconColor = "text-rose-500";
              } else {
                icon = (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                );
                iconBg = "bg-slate-100";
                iconColor = "text-slate-500";
              }

              return (
                <li key={activity.id} className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-10 h-10 ${iconBg} ${iconColor} rounded-full flex items-center justify-center shrink-0`}>
                    {icon}
                  </div>
                  <div>
                    <div className="text-[15px] text-slate-600 font-medium">
                      {activity.title}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 mt-0.5">
                      {activity.subtitle}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer Link */}
        <button className="w-full py-4 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-50/50 hover:bg-slate-100 transition-colors border-t border-slate-100">
          View Detailed Job History
        </button>
      </div>
    </div>
  );
}

