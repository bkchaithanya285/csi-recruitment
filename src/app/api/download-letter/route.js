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

    // Draw gold/maroon double border frame
    doc.setDrawColor(128, 0, 0); // CSI Maroon
    doc.setLineWidth(1);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    doc.setDrawColor(255, 107, 0); // CSI Orange
    doc.setLineWidth(0.5);
    doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

    // Read logo from local filesystem
    try {
      const logoPath = path.join(process.cwd(), "public", "csi-logo.jpg");
      if (fs.existsSync(logoPath)) {
        const logoBase64 = fs.readFileSync(logoPath).toString("base64");
        doc.addImage(`data:image/jpeg;base64,${logoBase64}`, "JPEG", (pageWidth - 35) / 2, 15, 35, 25);
      }
    } catch (err) {
      console.error("Server PDF: Failed to add logo:", err);
    }

    // Header Title & Subtitle
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
    
    // Fallback timestamp handling
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

    doc.line(15, 70, pageWidth - 15, 70);

    // Title
    doc.setTextColor(128, 0, 0);
    doc.setFont("times", "bold");
    doc.setFontSize(17);
    doc.text("OFFICIAL APPOINTMENT ORDER", pageWidth / 2, 82, { align: "center" });

    // Body
    doc.setTextColor(15, 23, 42);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`Dear ${app.name},`, 15, 94);

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

    // Details Box (Adjusted box size to fit 3 items)
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

    // Regards
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
