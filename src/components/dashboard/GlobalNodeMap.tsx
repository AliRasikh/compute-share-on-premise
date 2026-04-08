"use client";

import React from "react";

export function GlobalNodeMap() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Global Node Map</h3>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Network Online
        </div>
      </div>
      
      <div className="relative w-full h-72 bg-[#0b1120] rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        {/* Subtle dot matrix background */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        {/* Glowing aura at center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full point-events-none"></div>

        {/* Curved connection lines using SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
           <path d="M 25% 40% Q 40% 10% 55% 55%" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" strokeDasharray="6 6" className="animate-pulse" />
           <path d="M 55% 55% Q 70% 30% 80% 40%" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" />
        </svg>

        {/* Nodes */}
        {/* US East */}
        <div className="absolute top-[40%] left-[25%] flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-8 h-8 bg-emerald-400/20 rounded-full animate-ping"></div>
          <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,1)] z-10"></div>
        </div>
        
        {/* Europe / Africa boundary */}
        <div className="absolute top-[55%] left-[55%] flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div className="w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,1)] z-10"></div>
        </div>
        
        {/* Asia */}
        <div className="absolute top-[40%] left-[80%] flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-8 h-8 bg-emerald-400/20 rounded-full animate-ping" style={{ animationDelay: '1s'}}></div>
          <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,1)] z-10"></div>
        </div>

        {/* Optional decorative map elements/continents could be implemented as an overlay image, but dots sell the look well */}
      </div>
    </div>
  );
}
