"use client";

import { useState } from "react";
import { FaFileExcel, FaFilePdf, FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useToast } from "@/context/ToastContext";

export default function ExportPanel({ allApplicants, filteredApplicants }) {
  const { addToast } = useToast();
  const [exportType, setExportType] = useState("filtered"); // 'all' or 'filtered'

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getExportData = () => {
    const list = exportType === "all" ? allApplicants : filteredApplicants;
    return list.map((app) => ({
      Name: app.name,
      "Registration Number": app.registrationNumber,
      Year: app.year,
      Department: app.department,
      Section: app.section,
      Email: app.email,
      "Phone Number": app.phone,
      "Priority 1": app.priority1 || "",
      "Priority 2": app.priority2 || "",
      "Priority 3": app.priority3 || "",
      Status: app.status.toUpperCase(),
      "Applied Date": formatDate(app.timestamp)
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    if (data.length === 0) {
      addToast("No applications found to export.", "warning");
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Applicants");

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(...data.map(row => row[key]?.toString().length || 0), key.length) + 3
      }));
      ws["!cols"] = colWidths;

      const fileName = `CSI_KARE_Applicants_${exportType === "all" ? "All" : "Filtered"}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      addToast(`Successfully downloaded Excel sheet!`, "success");
    } catch (error) {
      console.error("Excel export error:", error);
      addToast("Failed to export Excel report.", "error");
    }
  };

  const handleExportPdf = () => {
    const data = getExportData();
    if (data.length === 0) {
      addToast("No applications found to export.", "warning");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Branded Title Header
      doc.setFillColor(128, 0, 0); // CSI Maroon
      doc.rect(0, 0, 297, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CSI KARE STUDENT CHAPTER RECRUITMENT REPORT", 14, 12);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()} | Scope: ${exportType === "all" ? "All Applicants" : "Filtered Applicants"} (${data.length} records)`, 14, 20);

      // Footer template helper
      const totalPagesExp = "{total_pages_count_string}";

      const columns = [
        { header: "Name", dataKey: "Name" },
        { header: "Reg No", dataKey: "Registration Number" },
        { header: "Year", dataKey: "Year" },
        { header: "Dept", dataKey: "Department" },
        { header: "Sec", dataKey: "Section" },
        { header: "Email", dataKey: "Email" },
        { header: "Phone", dataKey: "Phone Number" },
        { header: "P1 Priority", dataKey: "Priority 1" },
        { header: "P2 Priority", dataKey: "Priority 2" },
        { header: "P3 Priority", dataKey: "Priority 3" },
        { header: "Status", dataKey: "Status" },
        { header: "Date", dataKey: "Applied Date" }
      ];

      doc.autoTable({
        startY: 34,
        columns: columns,
        body: data,
        theme: "grid",
        headStyles: {
          fillColor: [128, 0, 0],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
          halign: "center"
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [255, 248, 245]
        },
        columnStyles: {
          Name: { cellWidth: 26 },
          "Registration Number": { cellWidth: 22 },
          Year: { cellWidth: 15 },
          Department: { cellWidth: 15 },
          Section: { cellWidth: 10 },
          Email: { cellWidth: 35 },
          "Phone Number": { cellWidth: 22 },
          "Priority 1": { cellWidth: 28 },
          "Priority 2": { cellWidth: 28 },
          "Priority 3": { cellWidth: 28 },
          Status: { cellWidth: 16, halign: "center" },
          "Applied Date": { cellWidth: 26 }
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (data) => {
          // Footer text
          const str = "Page " + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          
          // Page number on right
          doc.text(str, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
          // Branding on left
          doc.text("CSI KARE STUDENT CHAPTER — Web Team", 10, doc.internal.pageSize.height - 10);
        }
      });

      const fileName = `CSI_KARE_Applicants_${exportType === "all" ? "All" : "Filtered"}_${Date.now()}.pdf`;
      doc.save(fileName);
      addToast(`Successfully downloaded PDF report!`, "success");
    } catch (error) {
      console.error("PDF export error:", error);
      addToast("Failed to export PDF report.", "error");
    }
  };

  return (
    <div className="glass-panel-dark p-5 border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#1E0000]/20">
      
      {/* Label and selector */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[#800000]/10 text-[#FF6B00] border border-[#800000]/20">
          <FaDownload size={16} />
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-white font-bold text-sm tracking-wide">
            Download Center
          </h4>
          <p className="text-slate-400 text-xs mt-0.5">
            Export applicants records to Excel or PDF files.
          </p>
        </div>

        {/* Export Target Toggle */}
        <div className="flex bg-white/5 border border-white/8 rounded-lg p-1 ml-0 sm:ml-4 shrink-0">
          <button
            onClick={() => setExportType("filtered")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              exportType === "filtered"
                ? "bg-[#800000] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Filtered ({filteredApplicants.length})
          </button>
          <button
            onClick={() => setExportType("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              exportType === "all"
                ? "bg-[#800000] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({allApplicants.length})
          </button>
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        <button
          onClick={handleExportExcel}
          className="flex-grow sm:flex-grow-0 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-200 border border-emerald-500/20"
        >
          <FaFileExcel size={14} />
          <span>Export Excel</span>
        </button>

        <button
          onClick={handleExportPdf}
          className="flex-grow sm:flex-grow-0 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-200 border border-rose-500/20"
        >
          <FaFilePdf size={14} />
          <span>Export PDF Report</span>
        </button>
      </div>

    </div>
  );
}
