"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaTrash, 
  FaWhatsapp, 
  FaChevronLeft, 
  FaChevronRight, 
  FaSortAmountDown, 
  FaSortAmountUp,
  FaSpinner,
  FaUserCheck,
  FaFileAlt,
  FaEnvelope
} from "react-icons/fa";
import { updateApplicantStatus, deleteApplicant, approveApplicantWithRole } from "@/lib/db";
import { useToast } from "@/context/ToastContext";
import { jsPDF } from "jspdf";

const DEPT_OPTIONS = ["CSE", "ECE", "OTHER"];
const YEAR_OPTIONS = ["2nd Year", "3rd Year"];
const STATUS_OPTIONS = ["pending", "approved", "rejected"];
const ROLE_OPTIONS = [
  "Web Development Team",
  "AI & Machine Learning Team",
  "Technical Team",
  "Content Team",
  "Social Media Team",
  "Video Editing Team",
  "Event Coordinators",
  "PR & Outreach Team"
];

export default function ApplicantTable({ applicants, onFilteredChange, refreshData }) {
  const { addToast } = useToast();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Sorting state
  const [sortBy, setSortBy] = useState("timestamp"); // 'timestamp', 'name', 'registrationNumber'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Approval flow states
  const [approvalModalData, setApprovalModalData] = useState(null);
  const [approvedRole, setApprovedRole] = useState("");
  const [previewTab, setPreviewTab] = useState("whatsapp"); // Default to WhatsApp

  // Apply filters, searches, and sorts
  const processedApplicants = useMemo(() => {
    const filtered = applicants.filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
        app.phone.includes(search);

      const matchesDept = deptFilter ? app.department === deptFilter : true;
      const matchesYear = yearFilter ? app.year === yearFilter : true;
      const matchesStatus = statusFilter ? app.status === statusFilter : true;
      
      const matchesRole = roleFilter
        ? app.priority1 === roleFilter ||
          app.priority2 === roleFilter ||
          app.priority3 === roleFilter
        : true;

      return matchesSearch && matchesDept && matchesYear && matchesStatus && matchesRole;
    });

    const sorted = [...filtered].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "timestamp") {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }

      valA = (valA || "").toString().toLowerCase();
      valB = (valB || "").toString().toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [applicants, search, deptFilter, yearFilter, statusFilter, roleFilter, sortBy, sortOrder]);
  const totalPages = Math.ceil(processedApplicants.length / itemsPerPage);
  const paginatedApplicants = processedApplicants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Notify parent of filter updates for export synchronization
  useEffect(() => {
    onFilteredChange(processedApplicants);
  }, [processedApplicants, onFilteredChange]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, yearFilter, statusFilter, roleFilter]);

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === "approved") {
      const app = applicants.find(a => a.id === id);
      if (app) {
        setApprovalModalData({
          id: app.id,
          name: app.name,
          email: app.email,
          phone: app.phone,
          registrationNumber: app.registrationNumber,
          priority1: app.priority1 || ROLE_OPTIONS[0],
          priority2: app.priority2,
          priority3: app.priority3
        });
        setApprovedRole(app.priority1 || ROLE_OPTIONS[0]);
      }
      return;
    }

    setActionLoading(true);
    try {
      await updateApplicantStatus(id, newStatus);
      addToast(`Applicant status marked as ${newStatus}!`, "success");
      
      if (refreshData) {
        await refreshData();
      }
      
      // Update details modal if open
      if (selectedApplicant && selectedApplicant.id === id) {
        setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Status update error:", error);
      addToast("Failed to update applicant status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmApproval = async (sendWhatsapp = false) => {
    if (!approvalModalData) return;
    setActionLoading(true);
    try {
      await approveApplicantWithRole(approvalModalData.id, approvedRole);
      addToast(`Applicant approved as ${approvedRole}! Appointment Order sent.`, "success");
      
      if (refreshData) {
        await refreshData();
      }
      
      // Update details modal if open
      if (selectedApplicant && selectedApplicant.id === approvalModalData.id) {
        setSelectedApplicant(prev => ({ 
          ...prev, 
          status: "approved",
          approvedRole: approvedRole
        }));
      }

      if (sendWhatsapp) {
        const appYear = approvalModalData.timestamp && approvalModalData.timestamp.toDate 
          ? approvalModalData.timestamp.toDate().getFullYear() 
          : new Date().getFullYear();
        const regNoStr = approvalModalData.registrationNumber || "";
        const refNumber = `CSI-KARE-SC-${appYear}-${regNoStr.substring(Math.max(0, regNoStr.length - 4))}`;
        const currentDate = new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        });

        const rawMessage = `*CSI KARE STUDENT CHAPTER*
Kalasalingam Academy of Research and Education

*OFFICIAL APPOINTMENT ORDER*
--------------------------------------------------
*REF NO:* ${refNumber}
*DATE:* ${currentDate}
--------------------------------------------------

Dear ${approvalModalData.name},

Based on your performance in the recruitment interviews and evaluations held by the Executive Board, we are pleased to inform you that you have been selected to join the core team of *CSI KARE STUDENT CHAPTER* for the academic year 2026-2027.

You are hereby appointed to the following position with immediate effect:

• *Appointee Name:* ${approvalModalData.name}
• *Assigned Role/Domain:* *${approvedRole}*
• *Organization:* CSI KARE STUDENT CHAPTER

As a core committee member, you will be expected to work collaboratively with your team members, demonstrate leadership quality, and actively contribute to the workshops, technical events, and initiatives organized by the chapter.

Please join our official WhatsApp group for recruitment updates, onboarding details, and task assignments:
👉 https://chat.whatsapp.com/JIHcHWvPznSECokEFz8aln?s=cl&p=a&ilr=1

*Dr. P. Pandiselvam*
CSI KARE

Congratulations once again! We look forward to an outstanding tenure working together to drive academic and technical excellence.

Regards,
*CSI KARE STUDENT CHAPTER*`;
        const encodedMessage = encodeURIComponent(rawMessage);
        const link = `https://wa.me/91${approvalModalData.phone}?text=${encodedMessage}`;
        window.open(link, "_blank");
        addToast("Opening WhatsApp chat...", "info");
      }

      setApprovalModalData(null);
    } catch (error) {
      console.error("Approval error:", error);
      addToast("Failed to approve applicant.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteApplicant = async (id) => {
    // Instantly close modals for snappy UI feedback
    setDeleteConfirmId(null);
    if (selectedApplicant && selectedApplicant.id === id) {
      setSelectedApplicant(null);
    }
    
    setActionLoading(true);
    try {
      await deleteApplicant(id);
      addToast("Applicant record deleted successfully.", "success");
      
      if (refreshData) {
        await refreshData();
      }
    } catch (error) {
      console.error("Deletion error:", error);
      addToast("Failed to delete applicant record.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWhatsApp = (app) => {
    const rawMessage = `Hello ${app.name} 👋

Welcome to *CSI KARE STUDENT CHAPTER*.

Thank you for registering to become a part of our technical community.

Please join our official WhatsApp group for recruitment updates, interviews, workshops, coding sessions, and future events.

Official WhatsApp Group:
https://chat.whatsapp.com/JIHcHWvPznSECokEFz8aln?s=cl&p=a&ilr=1

We are excited to have you with us.

Regards,
CSI KARE STUDENT CHAPTER`;

    const encodedMessage = encodeURIComponent(rawMessage);
    const link = `https://wa.me/91${app.phone}?text=${encodedMessage}`;
    window.open(link, "_blank");
    addToast("Redirecting to WhatsApp chat...", "info");
  };

  const handleDownloadLetter = async (app) => {
    try {
      addToast("Generating PDF Letter...", "info");
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Draw a gold/maroon double border frame
      doc.setDrawColor(128, 0, 0); // CSI Maroon
      doc.setLineWidth(1);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
      doc.setDrawColor(255, 107, 0); // CSI Orange
      doc.setLineWidth(0.5);
      doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

      // Add Header Logo
      try {
        const logoUrl = "/csi-logo.jpg";
        const logoBase64 = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg"));
          };
          img.onerror = (e) => reject(e);
          img.src = logoUrl;
        });
        doc.addImage(logoBase64, "JPEG", (pageWidth - 35) / 2, 15, 35, 25);
      } catch (err) {
        console.error("Failed to add logo to PDF:", err);
      }

      // Title & Subtitle
      doc.setTextColor(15, 23, 42);
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.text("CSI KARE STUDENT CHAPTER", pageWidth / 2, 48, { align: "center" });

      doc.setFont("times", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Kalasalingam Academy of Research and Education, Krishnankoil", pageWidth / 2, 53, { align: "center" });

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15, 58, pageWidth - 15, 58);

      // Metadata: Ref No & Date
      doc.setFont("courier", "bold");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const appYear = app.timestamp && app.timestamp.toDate 
        ? app.timestamp.toDate().getFullYear() 
        : new Date().getFullYear();
      const refNumber = `REF: CSI-KARE-SC-${appYear}-${app.registrationNumber.substring(app.registrationNumber.length - 4)}`;
      const currentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      doc.text(refNumber, 15, 66);
      doc.text(`DATE: ${currentDate}`, pageWidth - 15, 66, { align: "right" });

      // Divider line
      doc.line(15, 70, pageWidth - 15, 70);

      // Document Title
      doc.setTextColor(128, 0, 0);
      doc.setFont("times", "bold");
      doc.setFontSize(17);
      doc.text("OFFICIAL APPOINTMENT ORDER", pageWidth / 2, 82, { align: "center" });

      // Salutation
      doc.setTextColor(15, 23, 42);
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(`Dear ${app.name},`, 15, 94);

      // Body copy
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      const body1 = "Based on your performance in the recruitment interviews and evaluations held by the Executive Board, we are pleased to inform you that you have been selected to join the core team of CSI KARE Student Chapter for the academic year 2026-2027.";
      const body2 = "You are hereby appointed to the following position with immediate effect:";

      let currentY = 101;
      const splitBody1 = doc.splitTextToSize(body1, pageWidth - 30);
      doc.text(splitBody1, 15, currentY);
      currentY += (splitBody1.length * 6) + 4;
      
      const splitBody2 = doc.splitTextToSize(body2, pageWidth - 30);
      doc.text(splitBody2, 15, currentY);
      currentY += (splitBody2.length * 6) + 6;

      // Key details box
      const boxStartY = currentY;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, boxStartY, pageWidth - 30, 33, "F");
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(15, boxStartY, pageWidth - 30, 33);

      doc.setFont("times", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("Appointee Name:", 20, boxStartY + 9);
      doc.text("Assigned Role/Domain:", 20, boxStartY + 17);
      doc.text("Organization:", 20, boxStartY + 25);

      doc.setTextColor(15, 23, 42);
      doc.text(app.name, pageWidth - 20, boxStartY + 9, { align: "right" });
      doc.setTextColor(128, 0, 0);
      doc.text(app.approvedRole || app.priority1 || "Core Member", pageWidth - 20, boxStartY + 17, { align: "right" });
      doc.setTextColor(15, 23, 42);
      doc.text("CSI KARE STUDENT CHAPTER", pageWidth - 20, boxStartY + 25, { align: "right" });

      currentY = boxStartY + 33 + 8;

      // Core team expectations
      doc.setFont("times", "normal");
      doc.setTextColor(51, 65, 85);
      const body3 = "As a core committee member, you will be expected to work collaboratively with your team members, demonstrate leadership quality, and actively contribute to the workshops, technical events, and initiatives organized by the chapter.";
      const body4 = "Please note that onboarding details and task assignments will be coordinated through our WhatsApp group.";
      const body5 = "Congratulations once again! We look forward to an outstanding tenure working together to drive academic and technical excellence.";

      const splitBody3 = doc.splitTextToSize(body3, pageWidth - 30);
      doc.text(splitBody3, 15, currentY);
      currentY += (splitBody3.length * 6) + 4;
      const splitBody4 = doc.splitTextToSize(body4, pageWidth - 30);
      doc.text(splitBody4, 15, currentY);
      currentY += (splitBody4.length * 6) + 4;
      const splitBody5 = doc.splitTextToSize(body5, pageWidth - 30);
      doc.text(splitBody5, 15, currentY);
      currentY += (splitBody5.length * 6) + 8;

      // Regards text
      doc.setFont("times", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Regards,", 15, currentY);
      doc.setTextColor(128, 0, 0);
      doc.text("CSI KARE STUDENT CHAPTER", 15, currentY + 5);

      // Signature metadata line
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.line((pageWidth - 60) / 2, currentY + 22, (pageWidth + 60) / 2, currentY + 22);

      doc.setTextColor(15, 23, 42);
      doc.setFont("times", "bold");
      doc.setFontSize(9.5);
      doc.text("Dr. P. Pandiselvam", pageWidth / 2, currentY + 26, { align: "center" });

      doc.setTextColor(100, 116, 139);
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.text("CSI KARE", pageWidth / 2, currentY + 30, { align: "center" });

      doc.save(`Appointment_Order_${app.name.replace(/\s+/g, "_")}.pdf`);
      addToast("Appointment Order downloaded successfully!", "success");
    } catch (error) {
      console.error("PDF generation error:", error);
      addToast("Failed to generate PDF.", "error");
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="glass-panel-dark p-5 space-y-4 border-white/10 bg-[#1E0000]/20 shadow-lg">
        
        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search by Name, Registration Number, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0F0000] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-all"
          />
        </div>

        {/* Filters Select Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Department */}
          <div className="flex flex-col">
            <label className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
              <FaFilter size={10} /> Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-[#0F0000] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
            >
              <option value="">All Departments</option>
              {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Year */}
          <div className="flex flex-col">
            <label className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
              <FaFilter size={10} /> Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-[#0F0000] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Role Priority */}
          <div className="flex flex-col">
            <label className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
              <FaFilter size={10} /> Role Choice
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#0F0000] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
              <FaFilter size={10} /> Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F0000] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>

        </div>

      </div>

      {/* Table Box */}
      <div className="glass-panel-dark overflow-hidden border-white/10 bg-[#1E0000]/10 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-300 text-[10px] font-bold tracking-widest uppercase bg-[#1E0000]/60 select-none">
                <th className="py-4 px-6 cursor-pointer hover:text-white" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    {sortBy === "name" && (sortOrder === "asc" ? <FaSortAmountUp size={10} /> : <FaSortAmountDown size={10} />)}
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort("registrationNumber")}>
                  <div className="flex items-center gap-1.5">
                    <span>Reg Number</span>
                    {sortBy === "registrationNumber" && (sortOrder === "asc" ? <FaSortAmountUp size={10} /> : <FaSortAmountDown size={10} />)}
                  </div>
                </th>
                <th className="py-4 px-4">Class (Yr / Dept / Sec)</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Priority 1 Choice</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-6 text-right cursor-pointer hover:text-white" onClick={() => toggleSort("timestamp")}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Applied Date</span>
                    {sortBy === "timestamp" && (sortOrder === "asc" ? <FaSortAmountUp size={10} /> : <FaSortAmountDown size={10} />)}
                  </div>
                </th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/10 text-slate-300 text-xs">
              {paginatedApplicants.map((app) => (
                <tr key={app.id} className="hover:bg-white/1.5 transition-colors">
                  
                  {/* Name */}
                  <td className="py-4 px-6 font-bold text-white tracking-wide">
                    {app.name}
                  </td>

                  {/* Reg No */}
                  <td className="py-4 px-4 font-mono tracking-wider font-semibold text-ieee-accent">
                    {app.registrationNumber}
                  </td>

                  {/* Class Info */}
                  <td className="py-4 px-4 font-medium">
                    {app.year.split(" ")[0]} / {app.department} / Sec {app.section}
                  </td>

                  {/* Contact Info */}
                  <td className="py-4 px-4 space-y-1">
                    <p className="font-semibold text-slate-200">{app.phone}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{app.email}</p>
                  </td>

                  {/* Priority 1 */}
                  <td className="py-4 px-4 font-bold text-white tracking-wide">
                    {app.priority1}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                      app.status === "approved"
                        ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400"
                        : app.status === "rejected"
                        ? "bg-rose-950/40 border-rose-500/20 text-rose-400"
                        : "bg-amber-950/40 border-amber-500/20 text-amber-400"
                    }`}>
                      {app.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-6 text-right font-medium text-slate-400">
                    {formatDate(app.timestamp)}
                  </td>

                  {/* Actions Buttons */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      {/* View */}
                      <button
                        onClick={() => setSelectedApplicant(app)}
                        className="p-2 rounded-lg bg-white/5 border border-white/8 text-slate-300 hover:text-white hover:border-white/20 transition-all"
                        title="View Full Profile"
                      >
                        <FaEye size={12} />
                      </button>

                      {/* WhatsApp Greeting */}
                      <button
                        onClick={() => handleSendWhatsApp(app)}
                        className="p-2 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
                        title="Send WhatsApp Greeting"
                      >
                        <FaWhatsapp size={12} />
                      </button>

                      {/* Approve */}
                      {app.status !== "approved" && (
                        <button
                          onClick={() => handleStatusChange(app.id, "approved")}
                          disabled={actionLoading}
                          className="p-2 rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-700 hover:text-white transition-all"
                          title="Approve Candidate"
                        >
                          <FaCheck size={12} />
                        </button>
                      )}

                      {/* Reject */}
                      {app.status !== "rejected" && (
                        <button
                          onClick={() => handleStatusChange(app.id, "rejected")}
                          disabled={actionLoading}
                          className="p-2 rounded-lg bg-rose-900/20 border border-rose-500/20 text-rose-400 hover:bg-rose-700 hover:text-white transition-all"
                          title="Reject Candidate"
                        >
                          <FaTimes size={12} />
                        </button>
                      )}

                      {/* Download PDF Letter for approved candidate */}
                      {app.status === "approved" && (
                        <button
                          onClick={() => handleDownloadLetter(app)}
                          className="p-2 rounded-lg bg-blue-900/20 border border-blue-500/20 text-blue-400 hover:bg-blue-700 hover:text-white transition-all"
                          title="Download Appointment Letter"
                        >
                          <FaFileAlt size={12} />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(app.id)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/10 text-rose-500 hover:bg-rose-900 hover:text-white transition-all"
                        title="Delete Applicant"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}

              {processedApplicants.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 px-6 text-center text-slate-500 font-semibold">
                    No applicants match the filter requirements.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="border-t border-white/5 py-4 px-6 flex items-center justify-between bg-white/2 select-none">
            <span className="text-slate-400 text-xs font-semibold">
              Showing page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({processedApplicants.length} entries)
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-white/8 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all cursor-pointer"
              >
                <FaChevronLeft size={10} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-white/8 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all cursor-pointer"
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel-dark w-full max-w-2xl border-white/10 bg-[#0F0000] shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#800000]/20 text-[#FF6B00] border border-[#800000]/30">
                  <FaUserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {selectedApplicant.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-mono">
                    Registration No: {selectedApplicant.registrationNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-slate-400 hover:text-white font-extrabold text-lg p-2 rounded-md hover:bg-white/5"
              >
                &times;
              </button>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 text-sm">
              <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Contact Phone</span>
                <p className="text-white font-semibold">{selectedApplicant.phone}</p>
              </div>
              <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Email Address</span>
                <p className="text-white font-semibold truncate">{selectedApplicant.email}</p>
              </div>
              <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Classroom (Yr / Dept)</span>
                <p className="text-white font-semibold">{selectedApplicant.year} &mdash; {selectedApplicant.department}</p>
              </div>
              <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Section</span>
                <p className="text-white font-semibold">Section {selectedApplicant.section}</p>
              </div>

              {/* Preferences List */}
              <div className="bg-white/2 border border-white/5 p-5 rounded-xl sm:col-span-2 space-y-3">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block border-b border-white/5 pb-2 mb-2">
                  Role Preferences Priorities
                </span>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-400 font-medium">Priority 1 (Highest)</span>
                    <strong className="text-white text-sm">{selectedApplicant.priority1 || "None Selected"}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-400 font-medium">Priority 2</span>
                    <strong className="text-slate-400">{selectedApplicant.priority2 || "None"}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-400 font-medium">Priority 3</span>
                    <strong className="text-slate-400">{selectedApplicant.priority3 || "None"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions inside Modal */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-white/5 pt-5">
              
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mr-2">Status:</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  selectedApplicant.status === "approved"
                    ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400"
                    : selectedApplicant.status === "rejected"
                    ? "bg-rose-950/40 border-rose-500/20 text-rose-400"
                    : "bg-amber-950/40 border-amber-500/20 text-amber-400"
                }`}>
                  {selectedApplicant.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleSendWhatsApp(selectedApplicant)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <FaWhatsapp size={14} />
                  <span>Send Greeting</span>
                </button>

                {selectedApplicant.status === "approved" && (
                  <button
                    onClick={() => handleDownloadLetter(selectedApplicant)}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer border border-blue-500/25"
                  >
                    <FaFileAlt size={14} />
                    <span>Download Letter</span>
                  </button>
                )}

                {selectedApplicant.status !== "approved" && (
                  <button
                    onClick={() => handleStatusChange(selectedApplicant.id, "approved")}
                    disabled={actionLoading}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 border border-emerald-500/25 text-emerald-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    <span>Approve</span>
                  </button>
                )}

                {selectedApplicant.status !== "rejected" && (
                  <button
                    onClick={() => handleStatusChange(selectedApplicant.id, "rejected")}
                    disabled={actionLoading}
                    className="py-2.5 px-4 rounded-xl bg-rose-600/15 hover:bg-rose-600 border border-rose-500/25 text-rose-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setDeleteConfirmId(selectedApplicant.id);
                  }}
                  className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                  title="Delete Application"
                >
                  <FaTrash size={12} />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="glass-panel-dark w-full max-w-sm border-rose-500/30 bg-[#0F0000] shadow-2xl p-6 text-center">
            <h4 className="text-white font-extrabold text-lg tracking-wide mb-2">
              Confirm Deletion
            </h4>
            <p className="text-slate-400 text-xs mb-6">
              Are you sure you want to permanently delete this applicant record? This action is irreversible.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-grow py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteApplicant(deleteConfirmId)}
                disabled={actionLoading}
                className="flex-grow py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer border border-rose-500/25"
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role & Due Date Selection Approval Modal */}
      {approvalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel-dark w-full max-w-4xl border-white/10 bg-[#0F0000] shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                  <FaUserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    Select Role & Approve: {approvalModalData.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-semibold">
                    Send Appointment Order via WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalModalData(null)}
                className="text-slate-400 hover:text-white font-extrabold text-lg p-2 rounded-md hover:bg-white/5"
              >
                &times;
              </button>
            </div>

            {/* Form & Previews Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-sm">
              
              {/* Left Column: Input Settings (5/12 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Select Approved Role */}
                <div className="flex flex-col">
                  <label className="text-slate-300 font-semibold text-xs tracking-wider uppercase mb-2">
                    Approved Role / Domain
                  </label>
                  <select
                    value={approvedRole}
                    onChange={(e) => setApprovedRole(e.target.value)}
                    className="w-full bg-[#0F0000] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-[#FF6B00] transition-all cursor-pointer"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {/* Applicant's Choices Info */}
                  <div className="mt-3 p-3 bg-white/2 border border-white/5 rounded-xl space-y-1.5 text-xs">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                      Applicant's Preferred Roles:
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">1st Choice:</span>
                      <strong className="text-white font-semibold">{approvalModalData.priority1 || "None"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">2nd Choice:</span>
                      <strong className="text-slate-400">{approvalModalData.priority2 || "None"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">3rd Choice:</span>
                      <strong className="text-slate-400">{approvalModalData.priority3 || "None"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Previews Tab Panel */}
              <div className="lg:col-span-7 flex flex-col h-full min-h-[300px]">
                
                {/* Preview Header */}
                <div className="flex items-center space-x-2 border-b border-white/10 pb-2.5 mb-4 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <FaWhatsapp size={14} />
                  <span>WhatsApp Appointment Order Preview</span>
                </div>

                {/* Previews Box */}
                <div className="flex-grow bg-[#0F0000] border border-white/10 rounded-2xl p-5 overflow-y-auto max-h-[350px]">
                  
                  {/* WhatsApp Chat Mock Preview */}
                  <div className="space-y-4 font-sans text-xs flex flex-col justify-end h-full">
                    <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg flex items-center space-x-2 mb-2 font-bold text-[10px] uppercase tracking-wider">
                      <FaWhatsapp size={14} />
                      <span>Pre-typed message layout:</span>
                    </div>
                    
                    {/* Chat Bubbles */}
                    <div className="flex flex-col space-y-3">
                      <div className="self-end bg-[#056162] text-white p-3 rounded-lg rounded-tr-none shadow-md max-w-[85%] space-y-2 font-mono whitespace-pre-line text-[11px] leading-relaxed border border-emerald-500/10">
                        {`*CSI KARE STUDENT CHAPTER*
Kalasalingam Academy of Research and Education

*OFFICIAL APPOINTMENT ORDER*
--------------------------------------------------
*REF NO:* CSI-KARE-SC-${new Date().getFullYear()}-${(approvalModalData.registrationNumber || "").substring(Math.max(0, (approvalModalData.registrationNumber || "").length - 4))}
*DATE:* ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
--------------------------------------------------

Dear ${approvalModalData.name},

Based on your performance in the recruitment interviews and evaluations held by the Executive Board, we are pleased to inform you that you have been selected to join the core team of *CSI KARE STUDENT CHAPTER* for the academic year 2026-2027.

You are hereby appointed to the following position with immediate effect:

• *Appointee Name:* ${approvalModalData.name}
• *Assigned Role/Domain:* *${approvedRole}*
• *Organization:* CSI KARE STUDENT CHAPTER

As a core committee member, you will be expected to work collaboratively with your team members, demonstrate leadership quality, and actively contribute to the workshops, technical events, and initiatives organized by the chapter.

Please join our official WhatsApp group for recruitment updates, onboarding details, and task assignments:
👉 https://chat.whatsapp.com/JIHcHWvPznSECokEFz8aln?s=cl&p=a&ilr=1

*Dr. P. Pandiselvam*
CSI KARE

Congratulations once again! We look forward to an outstanding tenure working together to drive academic and technical excellence.

Regards,
*CSI KARE STUDENT CHAPTER*`}
                      </div>
                      <div className="self-end text-[9px] text-slate-500 pr-1 select-none">
                        Delivered • Message ready to send
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end items-center border-t border-white/5 pt-6 mt-6">
              <button
                type="button"
                onClick={() => setApprovalModalData(null)}
                className="w-full sm:w-auto py-3 px-6 rounded-xl border border-white/8 text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleConfirmApproval(true)}
                disabled={actionLoading}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-emerald-500/25 shadow-md shadow-emerald-950/50"
              >
                <FaWhatsapp size={14} />
                <span>{actionLoading ? "Processing..." : "Approve & Send WhatsApp"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
