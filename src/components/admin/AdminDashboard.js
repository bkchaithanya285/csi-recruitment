"use client";

import { useEffect, useState, useCallback } from "react";
import { FaSignOutAlt, FaShieldAlt, FaSpinner, FaTrash } from "react-icons/fa";
import { getApplicants, deleteAllApplicants } from "@/lib/db";
import StatsPanel from "./StatsPanel";
import ExportPanel from "./ExportPanel";
import ApplicantTable from "./ApplicantTable";

import { ROLE_OPTIONS } from "./ApplicantTable";

export default function AdminDashboard({ logout, userEmail }) {
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    const confirmClear = window.confirm(
      "⚠️ WARNING: Are you absolutely sure you want to delete ALL applications?\nThis will permanently delete all records from Firestore and cannot be undone!"
    );
    if (!confirmClear) return;

    setClearing(true);
    try {
      const res = await deleteAllApplicants();
      alert(`Successfully deleted all ${res.count} application records.`);
      await fetchApplicants();
    } catch (error) {
      console.error("Failed to delete all applicants:", error);
      alert("Error: Failed to delete applications.");
    } finally {
      setClearing(false);
    }
  };

  const fetchApplicants = useCallback(async () => {
    try {
      const data = await getApplicants();
      setApplicants(data);
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // Compute stats and distributions
  const computeStats = () => {
    const stats = {
      total: applicants.length,
      today: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    const distributions = {
      department: { CSE: 0, ECE: 0, OTHER: 0 },
      year: { "2nd Year": 0, "3rd Year": 0 },
      role: {},
      approvedRoles: {},
    };

    ROLE_OPTIONS.forEach((role) => {
      distributions.approvedRoles[role] = 0;
    });

    const todayDateStr = new Date().toDateString();

    applicants.forEach((app) => {
      // Status counters
      if (app.status === "approved") {
        stats.approved++;
        const approvedR = app.approvedRole || app.priority1 || "Core Member";
        distributions.approvedRoles[approvedR] = (distributions.approvedRoles[approvedR] || 0) + 1;
      } else if (app.status === "rejected") {
        stats.rejected++;
      } else {
        stats.pending++;
      }

      // Applied today counter
      if (app.timestamp) {
        const appDate = app.timestamp.toDate ? app.timestamp.toDate() : new Date(app.timestamp);
        if (appDate.toDateString() === todayDateStr) {
          stats.today++;
        }
      }

      // Department distributions
      if (distributions.department[app.department] !== undefined) {
        distributions.department[app.department]++;
      } else {
        distributions.department.OTHER++;
      }

      // Year distributions
      if (distributions.year[app.year] !== undefined) {
        distributions.year[app.year]++;
      }

      // Role choice (Priority 1) distributions
      if (app.priority1) {
        distributions.role[app.priority1] = (distributions.role[app.priority1] || 0) + 1;
      }
    });

    return { stats, distributions };
  };

  const { stats, distributions } = computeStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0000]">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="animate-spin text-[#FF6B00] text-4xl" />
          <p className="text-slate-400 text-sm font-semibold tracking-wider">
            Synchronising Database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0000] via-[#1E0000] to-[#0A0000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 pt-10">
        
        {/* Header Panel */}
        <div className="glass-panel-dark p-6 border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1E0000]/20 shadow-xl">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="p-2.5 rounded-xl bg-[#800000]/20 text-[#FF6B00] border border-[#800000]/30 shadow-[0_0_15px_rgba(255,107,0,0.15)]">
              <FaShieldAlt size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">
                Admin Profile: <strong className="text-slate-300 font-semibold">{userEmail}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {clearing ? (
                <FaSpinner className="animate-spin text-red-400" />
              ) : (
                <FaTrash />
              )}
              <span>Delete All Applications</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-500/20 text-rose-400 hover:text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer"
            >
              <FaSignOutAlt />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Counters & Visual Distribution Progress bars */}
        <StatsPanel stats={stats} distributions={distributions} />

        {/* Download center for PDF and Excel reports */}
        <ExportPanel allApplicants={applicants} filteredApplicants={filteredApplicants} />

        {/* Applicant list with searches, pagination and actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-white tracking-wider uppercase pl-3 border-l-2 border-[#FF6B00]">
            Applications Registry
          </h2>
          <ApplicantTable 
            applicants={applicants} 
            onFilteredChange={setFilteredApplicants} 
            refreshData={fetchApplicants}
          />
        </div>

      </div>
    </div>
  );
}
