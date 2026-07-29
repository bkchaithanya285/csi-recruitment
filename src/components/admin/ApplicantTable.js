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

export const DEPT_OPTIONS = ["CSE", "ECE", "OTHER"];
export const YEAR_OPTIONS = ["2nd Year", "3rd Year"];
export const STATUS_OPTIONS = ["pending", "approved", "rejected"];
export const ROLE_OPTIONS = [
  "Web Development Team",
  "AI & Machine Learning Team",
  "Technical Team",
  "Research Team",
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
  const [approvedRoleFilter, setApprovedRoleFilter] = useState("");

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

  // Role-wise approved counts calculation
  const approvedRoleCounts = useMemo(() => {
    const counts = {};
    ROLE_OPTIONS.forEach((role) => {
      counts[role] = 0;
    });
    applicants.forEach((app) => {
      if (app.status === "approved") {
        const role = app.approvedRole || app.priority1 || "Core Member";
        counts[role] = (counts[role] || 0) + 1;
      }
    });
    return counts;
  }, [applicants]);

  const totalApprovedCount = useMemo(() => {
    return applicants.filter((a) => a.status === "approved").length;
  }, [applicants]);

  // Apply filters, searches, and sorts
  const processedApplicants = useMemo(() => {
    const searchLower = (search || "").toLowerCase();
    const filtered = (applicants || []).filter((app) => {
      if (!app) return false;
      const appName = (app.name || "").toLowerCase();
      const appReg = (app.registrationNumber || "").toLowerCase();
      const appPhone = (app.phone || "").toString();

      const matchesSearch =
        appName.includes(searchLower) ||
        appReg.includes(searchLower) ||
        appPhone.includes(searchLower);

      const matchesDept = deptFilter ? app.department === deptFilter : true;
      const matchesYear = yearFilter ? app.year === yearFilter : true;
      const matchesStatus = statusFilter ? app.status === statusFilter : true;
      
      const matchesRole = roleFilter
        ? app.priority1 === roleFilter ||
          app.priority2 === roleFilter ||
          app.priority3 === roleFilter
        : true;

      const appApprovedRole = app.approvedRole || (app.status === "approved" ? app.priority1 : "");
      const matchesApprovedRole = approvedRoleFilter
        ? app.status === "approved" && appApprovedRole === approvedRoleFilter
        : true;

      return matchesSearch && matchesDept && matchesYear && matchesStatus && matchesRole && matchesApprovedRole;
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
  }, [applicants, search, deptFilter, yearFilter, statusFilter, roleFilter, approvedRoleFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(processedApplicants.length / itemsPerPage));
  const paginatedApplicants = useMemo(() => {
    return processedApplicants.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [processedApplicants, currentPage, itemsPerPage]);

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

        const originUrl = typeof window !== "undefined" ? window.location.origin : "https://csi-recruitment-36336.web.app";
        const downloadUrl = `${originUrl}/api/download-letter?id=${approvalModalData.id}`;

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
👉 https://chat.whatsapp.com/BACSzvXP7F9HvD7kFfAjit?s=cl&p=a&ilr=1&amv=2

📄 *Download Official Appointment Order:*
${downloadUrl}

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
    const originUrl = typeof window !== "undefined" ? window.location.origin : "https://csi-recruitment-36336.web.app";
    const downloadUrl = `${originUrl}/api/download-letter?id=${app.id}`;
    
    let rawMessage = "";
    if (app.status === "approved") {
      const appYear = app.timestamp && app.timestamp.toDate 
        ? app.timestamp.toDate().getFullYear() 
        : new Date().getFullYear();
      const regNoStr = app.registrationNumber || "";
      const refNumber = `CSI-KARE-SC-${appYear}-${regNoStr.substring(Math.max(0, regNoStr.length - 4))}`;
      const currentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      const assignedRole = app.approvedRole || app.priority1 || "Core Member";

      rawMessage = `*CSI KARE STUDENT CHAPTER*
Kalasalingam Academy of Research and Education

*OFFICIAL APPOINTMENT ORDER*
--------------------------------------------------
*REF NO:* ${refNumber}
*DATE:* ${currentDate}
--------------------------------------------------

Dear ${app.name},

Based on your performance in the recruitment interviews and evaluations held by the Executive Board, we are pleased to inform you that you have been selected to join the core team of *CSI KARE STUDENT CHAPTER* for the academic year 2026-2027.

You are hereby appointed to the following position with immediate effect:

• *Appointee Name:* ${app.name}
• *Assigned Role/Domain:* *${assignedRole}*
• *Organization:* CSI KARE STUDENT CHAPTER

As a core committee member, you will be expected to work collaboratively with your team members, demonstrate leadership quality, and actively contribute to the workshops, technical events, and initiatives organized by the chapter.

Please join our official WhatsApp group for recruitment updates, onboarding details, and task assignments:
👉 https://chat.whatsapp.com/BACSzvXP7F9HvD7kFfAjit?s=cl&p=a&ilr=1&amv=2

📄 *Download Official Appointment Order:*
${downloadUrl}

*Dr. P. Pandiselvam*
CSI KARE

Congratulations once again! We look forward to an outstanding tenure working together to drive academic and technical excellence.

Regards,
*CSI KARE STUDENT CHAPTER*`;
    } else {
      rawMessage = `Hello ${app.name} 👋

Welcome to *CSI KARE STUDENT CHAPTER*.

Thank you for registering to become a part of our technical community.

Please join our official WhatsApp group for recruitment updates, interviews, workshops, coding sessions, and future events.

Official WhatsApp Group:
https://chat.whatsapp.com/BACSzvXP7F9HvD7kFfAjit?s=cl&p=a&ilr=1&amv=2

We are excited to have you with us.

Regards,
CSI KARE STUDENT CHAPTER`;
    }

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

      // Helper function to load base64 image
      const loadImageBase64 = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = (e) => reject(e);
          img.src = url;
        });
      };

      let primaryLogoBase64 = null;
      let officialLogoBase64 = null;
      let signatureBase64 = null;

      try {
        primaryLogoBase64 = await loadImageBase64("/csi-logo.jpg");
      } catch (err) { console.error("Primary logo load failed", err); }

      try {
        officialLogoBase64 = await loadImageBase64("/csi_off.png");
      } catch (err) { console.error("Official logo load failed", err); }

      try {
        signatureBase64 = await loadImageBase64("/signature.jpg");
      } catch (err) { console.error("Signature load failed", err); }

      // --- WATERMARK (csi-logo.jpg) ---
      if (primaryLogoBase64) {
        try {
          if (doc.GState) {
            doc.setGState(new doc.GState({ opacity: 0.08 }));
          }
          const wmW = 110;
          const wmH = 110;
          doc.addImage(primaryLogoBase64, "PNG", (pageWidth - wmW) / 2, (pageHeight - wmH) / 2, wmW, wmH);
          if (doc.GState) {
            doc.setGState(new doc.GState({ opacity: 1.0 }));
          }
        } catch (wErr) {
          console.error("Watermark error:", wErr);
          if (doc.GState) {
            doc.setGState(new doc.GState({ opacity: 1.0 }));
          }
        }
      }

      // --- BORDER FRAME ---
      doc.setDrawColor(128, 0, 0); // CSI Maroon
      doc.setLineWidth(1.2);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      doc.setDrawColor(255, 107, 0); // CSI Orange
      doc.setLineWidth(0.4);
      doc.rect(9.8, 9.8, pageWidth - 19.6, pageHeight - 19.6);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

      // --- HEADER LOGOS & TITLE ---
      if (primaryLogoBase64) {
        doc.addImage(primaryLogoBase64, "PNG", 15, 15, 26, 26);
      }

      if (officialLogoBase64) {
        doc.addImage(officialLogoBase64, "PNG", pageWidth - 41, 15, 26, 26);
      }

      doc.setTextColor(128, 0, 0);
      doc.setFont("times", "bold");
      doc.setFontSize(17);
      doc.text("CSI KARE STUDENT CHAPTER", pageWidth / 2, 23, { align: "center" });

      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("COMPUTER SOCIETY OF INDIA", pageWidth / 2, 29, { align: "center" });

      doc.setFont("times", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Kalasalingam Academy of Research and Education, Krishnankoil", pageWidth / 2, 34, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(128, 0, 0);
      doc.text("OFFICIAL RECRUITMENT CELL • ACADEMIC YEAR 2026-2027", pageWidth / 2, 39, { align: "center" });

      // Divider Line
      doc.setDrawColor(128, 0, 0);
      doc.setLineWidth(0.6);
      doc.line(15, 44, pageWidth - 15, 44);

      doc.setDrawColor(255, 107, 0);
      doc.setLineWidth(0.3);
      doc.line(15, 45, pageWidth - 15, 45);

      // --- METADATA: REF NO & DATE ---
      doc.setFont("courier", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      
      const appYear = app.timestamp && app.timestamp.toDate 
        ? app.timestamp.toDate().getFullYear() 
        : new Date().getFullYear();
      const regNoStr = app.registrationNumber || "";
      const refNumber = `REF: CSI-KARE-SC-${appYear}-${regNoStr.substring(Math.max(0, regNoStr.length - 4))}`;
      const currentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });

      doc.text(refNumber, 15, 52);
      doc.text(`DATE: ${currentDate}`, pageWidth - 15, 52, { align: "right" });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(15, 55, pageWidth - 15, 55);

      // --- DOCUMENT TITLE BANNER ---
      doc.setFillColor(254, 242, 242);
      doc.rect(15, 60, pageWidth - 30, 11, "F");
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.3);
      doc.rect(15, 60, pageWidth - 30, 11);

      doc.setTextColor(128, 0, 0);
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("OFFICIAL APPOINTMENT ORDER", pageWidth / 2, 67.5, { align: "center" });

      // --- LETTER BODY ---
      let currentY = 80;
      doc.setTextColor(15, 23, 42);
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(`Dear ${app.name},`, 15, currentY);

      currentY += 7;
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85);
      
      const body1 = "Based on your outstanding performance in the recruitment evaluations, coding sessions, and interviews conducted by the Executive Board, we are delighted to inform you that you have been selected to join the core committee of CSI KARE Student Chapter for the academic year 2026-2027.";
      const body2 = "You are hereby officially appointed to the following position with immediate effect:";

      const splitBody1 = doc.splitTextToSize(body1, pageWidth - 30);
      doc.text(splitBody1, 15, currentY);
      currentY += (splitBody1.length * 5.5) + 3;

      const splitBody2 = doc.splitTextToSize(body2, pageWidth - 30);
      doc.text(splitBody2, 15, currentY);
      currentY += (splitBody2.length * 5.5) + 5;

      // --- DETAILS BOX ---
      const boxStartY = currentY;
      const boxHeight = 35;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, boxStartY, pageWidth - 30, boxHeight, "F");
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.rect(15, boxStartY, pageWidth - 30, boxHeight);

      doc.setFillColor(128, 0, 0);
      doc.rect(15, boxStartY, 3, boxHeight, "F");

      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Appointee Name:", 22, boxStartY + 9);
      doc.text("Assigned Role / Domain:", 22, boxStartY + 18);
      doc.text("Organization:", 22, boxStartY + 27);

      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(app.name, pageWidth - 20, boxStartY + 9, { align: "right" });

      doc.setTextColor(128, 0, 0);
      doc.text(app.approvedRole || app.priority1 || "Core Committee Member", pageWidth - 20, boxStartY + 18, { align: "right" });

      doc.setTextColor(15, 23, 42);
      doc.text("CSI KARE STUDENT CHAPTER", pageWidth - 20, boxStartY + 27, { align: "right" });

      currentY = boxStartY + boxHeight + 8;

      // --- RESPONSIBILITIES & EXPECTATIONS ---
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85);

      const body3 = "As a core committee member, you will be expected to work collaboratively with your domain leads, demonstrate technical leadership, and actively organize workshops, hackathons, and guest lectures under the CSI Banner.";
      const body4 = "Please ensure that you join our official WhatsApp group for task assignments, onboarding, and project allocations.";
      const body5 = "We congratulate you on your selection and look forward to an impactful tenure together.";

      const splitBody3 = doc.splitTextToSize(body3, pageWidth - 30);
      doc.text(splitBody3, 15, currentY);
      currentY += (splitBody3.length * 5.5) + 3;

      const splitBody4 = doc.splitTextToSize(body4, pageWidth - 30);
      doc.text(splitBody4, 15, currentY);
      currentY += (splitBody4.length * 5.5) + 3;

      const splitBody5 = doc.splitTextToSize(body5, pageWidth - 30);
      doc.text(splitBody5, 15, currentY);
      currentY += (splitBody5.length * 5.5) + 8;

      // --- SIGNATURE BLOCK ---
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Yours sincerely,", 15, currentY);
      doc.setTextColor(128, 0, 0);
      doc.text("CSI KARE STUDENT CHAPTER", 15, currentY + 5);

      const sigCenterY = currentY + 12;

      if (signatureBase64) {
        try {
          doc.addImage(signatureBase64, "PNG", (pageWidth / 2) - 22, sigCenterY, 44, 16);
        } catch (sErr) {
          console.error("Failed to embed signature image:", sErr);
        }
      }

      const lineY = sigCenterY + 17;
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line((pageWidth - 70) / 2, lineY, (pageWidth + 70) / 2, lineY);

      doc.setTextColor(15, 23, 42);
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.text("Dr. P. Pandiselvam", pageWidth / 2, lineY + 5, { align: "center" });

      doc.setTextColor(100, 116, 139);
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.text("Faculty Sponsor / Advisor • CSI KARE", pageWidth / 2, lineY + 9, { align: "center" });

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

      {/* Role-Wise Approved Counts & Quick Filters Bar */}
      <div className="glass-panel-dark p-5 border-white/10 bg-[#1E0000]/30 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <FaUserCheck size={14} />
            <span>Role-Wise Approved Candidates Breakdown</span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
              {totalApprovedCount} Total Approved
            </span>
          </div>
          {approvedRoleFilter && (
            <button
              onClick={() => setApprovedRoleFilter("")}
              className="text-[11px] text-emerald-400 hover:text-white font-semibold underline transition-colors cursor-pointer"
            >
              Reset Approved Role Filter
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setApprovedRoleFilter("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              !approvedRoleFilter
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40"
                : "bg-[#0F0000] border-white/10 text-slate-300 hover:border-emerald-500/40 hover:text-white"
            }`}
          >
            All Approved ({totalApprovedCount})
          </button>

          {ROLE_OPTIONS.map((role) => {
            const count = approvedRoleCounts[role] || 0;
            const isSelected = approvedRoleFilter === role;
            return (
              <button
                key={role}
                onClick={() => setApprovedRoleFilter(isSelected ? "" : role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50 ring-2 ring-emerald-400/30"
                    : count > 0
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400/50"
                    : "bg-[#0F0000] border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
                }`}
              >
                <span>{role}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? "bg-white/25 text-white"
                      : count > 0
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                      : "bg-white/5 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
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
              <option value="">All Depts</option>
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
              <option value="">All Applied Roles</option>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Approved Role Filter */}
          <div className="flex flex-col">
            <label className="text-emerald-400 text-[10px] font-semibold tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
              <FaUserCheck size={10} /> Approved Role
            </label>
            <select
              value={approvedRoleFilter}
              onChange={(e) => setApprovedRoleFilter(e.target.value)}
              className="bg-[#0F0000] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-300 focus:outline-none focus:border-emerald-400 transition-all cursor-pointer"
            >
              <option value="">All Approved Roles</option>
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>
                  {r} ({approvedRoleCounts[r] || 0})
                </option>
              ))}
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
                <th className="py-4 px-4 text-emerald-400">Approved Role</th>
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
                    {(app.year || "N/A").split(" ")[0]} / {app.department || "N/A"} / Sec {app.section || "N/A"}
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

                  {/* Approved Role */}
                  <td className="py-4 px-4 font-bold tracking-wide">
                    {app.status === "approved" ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                        {app.approvedRole || app.priority1 || "Core Member"}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs font-normal pl-2">-</span>
                    )}
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

              {/* Approved Role Highlight Card */}
              {selectedApplicant.status === "approved" && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl sm:col-span-2 flex items-center justify-between shadow-lg shadow-emerald-950/20">
                  <div>
                    <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider block">Assigned / Approved Role</span>
                    <p className="text-emerald-300 font-extrabold text-base mt-0.5">{selectedApplicant.approvedRole || selectedApplicant.priority1 || "Core Committee Member"}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    Official Appointment
                  </span>
                </div>
              )}

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
👉 https://chat.whatsapp.com/BACSzvXP7F9HvD7kFfAjit?s=cl&p=a&ilr=1&amv=2

📄 *Download Official Appointment Order:*
${typeof window !== "undefined" ? window.location.origin : "https://csi-recruitment-36336.web.app"}/api/download-letter?id=${approvalModalData.id}

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
