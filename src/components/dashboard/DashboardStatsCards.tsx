"use client";

import React from "react";

export function DashboardStatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Compute Bought */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Compute Bought</div>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">128</span>
          <span className="text-xs text-slate-400 font-medium">Cores Active</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 flex overflow-hidden">
          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
        </div>
      </div>

      {/* Compute Sold */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Compute Sold</div>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">64</span>
          <span className="text-xs text-slate-400 font-medium">Cores Provisioned</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 flex overflow-hidden">
          <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '40%' }}></div>
        </div>
      </div>

      {/* Total Earnings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Earnings</div>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">+$14.20</span>
          <span className="text-xs text-emerald-500 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">this week</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-xs font-medium text-slate-500">8% increase from last week</span>
        </div>
      </div>
    </div>
  );
}
