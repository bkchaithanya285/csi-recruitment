import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing applicant ID", { status: 400 });
  }

  if (!adminDb) {
    return new NextResponse("Database not initialized", { status: 500 });
  }

  try {
    const docRef = adminDb.collection("Applicants").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return new NextResponse("Applicant not found", { status: 404 });
    }

    const app = snap.data();
    if (app.status !== "approved") {
      return new NextResponse("Applicant is not approved yet", { status: 403 });
    }

    // Generate PDF Appointment Order
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load images
    let primaryLogoBase64 = null;
    let officialLogoBase64 = null;
    let signatureBase64 = null;

    try {
      const primaryLogoPath = path.join(process.cwd(), "public", "csi-logo.jpg");
      if (fs.existsSync(primaryLogoPath)) {
        primaryLogoBase64 = fs.readFileSync(primaryLogoPath).toString("base64");
      }
      const officialLogoPath = path.join(process.cwd(), "public", "csi_off.png");
      if (fs.existsSync(officialLogoPath)) {
        officialLogoBase64 = fs.readFileSync(officialLogoPath).toString("base64");
      }
      const sigPath = path.join(process.cwd(), "public", "signature.jpg");
      if (fs.existsSync(sigPath)) {
        signatureBase64 = fs.readFileSync(sigPath).toString("base64");
      }
    } catch (err) {
      console.error("Server PDF: Error reading image assets:", err);
    }

    // --- WATERMARK ---
    if (officialLogoBase64 || primaryLogoBase64) {
      try {
        if (doc.GState) {
          doc.setGState(new doc.GState({ opacity: 0.08 }));
        }
        const wmLogo = officialLogoBase64 ? `data:image/png;base64,${officialLogoBase64}` : `data:image/jpeg;base64,${primaryLogoBase64}`;
        const wmType = officialLogoBase64 ? "PNG" : "JPEG";
        const wmW = 110;
        const wmH = 110;
        doc.addImage(wmLogo, wmType, (pageWidth - wmW) / 2, (pageHeight - wmH) / 2, wmW, wmH);
        if (doc.GState) {
          doc.setGState(new doc.GState({ opacity: 1.0 }));
        }
      } catch (wErr) {
        console.error("Watermark render error:", wErr);
        if (doc.GState) {
          doc.setGState(new doc.GState({ opacity: 1.0 }));
        }
      }
    }

    // --- BORDER FRAME ---
    // Outer Maroon Border
    doc.setDrawColor(128, 0, 0); // CSI Maroon
    doc.setLineWidth(1.2);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner Orange Accent Border
    doc.setDrawColor(255, 107, 0); // CSI Orange
    doc.setLineWidth(0.4);
    doc.rect(9.8, 9.8, pageWidth - 19.6, pageHeight - 19.6);

    // Subtle Inner Guide Box
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

    // --- HEADER LOGOS & TITLE ---
    // Left Primary Logo
    if (primaryLogoBase64) {
      doc.addImage(`data:image/jpeg;base64,${primaryLogoBase64}`, "JPEG", 15, 15, 26, 26);
    }

    // Right Official CSI Logo
    if (officialLogoBase64) {
      doc.addImage(`data:image/png;base64,${officialLogoBase64}`, "PNG", pageWidth - 41, 15, 26, 26);
    }

    // Header Title & Subtitle
    doc.setTextColor(128, 0, 0); // Maroon
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
    doc.setFillColor(254, 242, 242); // Soft red accent fill
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

    // Left Colored Strip
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

    // Render Signature Image if available
    if (signatureBase64) {
      try {
        doc.addImage(`data:image/jpeg;base64,${signatureBase64}`, "JPEG", (pageWidth / 2) - 22, sigCenterY, 44, 16);
      } catch (sErr) {
        console.error("Failed to embed signature in server PDF:", sErr);
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

    // Output PDF Buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Appointment_Order_${app.name.replace(/\s+/g, "_")}.pdf`
      }
    });

  } catch (err) {
    console.error("API download letter error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
