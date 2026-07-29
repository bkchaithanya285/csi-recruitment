"use client";

import { FaUsers, FaUserClock, FaUserCheck, FaUserTimes, FaCalendarDay } from "react-icons/fa";

export default function StatsPanel({ stats, distributions }) {
  const cards = [
    { label: "Total Applications", value: stats.total, icon: FaUsers, color: "text-[#FF6B00] bg-[#800000]/10 border-[#800000]/20" },
    { label: "Applications Today", value: stats.today, icon: FaCalendarDay, color: "text-blue-400 bg-blue-950/20 border-blue-500/20" },
    { label: "Pending Screening", value: stats.pending, icon: FaUserClock, color: "text-amber-400 bg-amber-950/20 border-amber-500/20" },
    { label: "Approved Candidates", value: stats.approved, icon: FaUserCheck, color: "text-emerald-400 bg-emerald-950/20 border-emerald-500/20" },
    { label: "Rejected Candidates", value: stats.rejected, icon: FaUserTimes, color: "text-rose-400 bg-rose-950/20 border-rose-500/20" },
  ];

  const getPercentage = (count, total) => {
    if (!total) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`glass-panel-dark p-5 border flex flex-col justify-between ${card.color.split(" ")[2] || ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-2.5 rounded-lg border ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <span className="text-white text-3xl font-extrabold tracking-tight">
                {card.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Distributions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Department Distribution */}
        <div className="glass-panel-dark p-6 border-white/10">
          <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-6 border-b border-white/10 pb-3">
            Department Distribution
          </h4>
          <div className="space-y-4">
            {Object.entries(distributions.department).map(([dept, count]) => {
              const pct = getPercentage(count, stats.total);
              return (
                <div key={dept} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">{dept}</span>
                    <span className="text-[#FF6B00]">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#FF6B00] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year Distribution */}
        <div className="glass-panel-dark p-6 border-white/10">
          <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-6 border-b border-white/10 pb-3">
            Year Distribution
          </h4>
          <div className="space-y-4">
            {Object.entries(distributions.year).map(([year, count]) => {
              const pct = getPercentage(count, stats.total);
              return (
                <div key={year} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">{year}</span>
                    <span className="text-[#FF6B00]">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#800000] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Preferences Distribution */}
        <div className="glass-panel-dark p-6 border-white/10">
          <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-6 border-b border-white/10 pb-3">
            Role Preferences (Priority 1)
          </h4>
          <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
            {Object.entries(distributions.role).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
              const pct = getPercentage(count, stats.total);
              return (
                <div key={role} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-300 truncate max-w-[200px]">{role}</span>
                    <span className="text-[#FF6B00] shrink-0">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#800000] to-[#FF6B00] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(distributions.role).length === 0 && (
              <p className="text-slate-500 text-xs text-center py-10 font-medium">No roles recorded</p>
            )}
          </div>
        </div>

      </div>

      {/* Role-Wise Approved Candidates Breakdown Panel */}
      <div className="glass-panel-dark p-6 border-white/10 bg-[#1E0000]/20 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 mb-6 gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <FaUserCheck size={16} />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
                Approved Candidates Count by Role
              </h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Breakdown of officially appointed members across chapter domains
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            {stats.approved} Total Approved
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {distributions.approvedRoles && Object.entries(distributions.approvedRoles).map(([role, count]) => {
            const pct = stats.approved > 0 ? Math.round((count / stats.approved) * 100) : 0;
            return (
              <div key={role} className="bg-[#0F0000] border border-white/10 p-4 rounded-xl space-y-2 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-300 text-xs font-bold leading-snug">{role}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-extrabold shrink-0 border border-emerald-500/30">
                    {count}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>% of Approved</span>
                    <span className="text-emerald-400">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
