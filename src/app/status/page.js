"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaSearch, FaDownload, FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaArrowLeft, FaFilePdf } from "react-icons/fa";
import { getApplicantByRegNumber } from "@/lib/db";
import { useToast } from "@/context/ToastContext";

export default function StatusChecker() {
  const { addToast } = useToast();
  const [regNo, setRegNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [applicant, setApplicant] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!regNo.trim()) {
      addToast("Please enter a valid registration number.", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await getApplicantByRegNumber(regNo);
      setApplicant(res);
      setSearched(true);
      if (res) {
        addToast("Application record found!", "success");
      } else {
        addToast("No application found for this registration number.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to search status. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-800";
      case "rejected":
        return "from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-800";
      default:
        return "from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-800";
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-800 flex flex-col pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
        
        {/* Navigation back home */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-all text-sm font-semibold">
            <FaArrowLeft size={12} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header Block */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            Check Selection <span className="text-[#FF6B00]">Status</span>
          </h1>
          <p className="mt-3 text-slate-600 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Enter your Kalasalingam Academy registration number below to check your CSI KARE STUDENT CHAPTER recruitment status.
          </p>
        </div>

        {/* Input Form */}
        <div className="glass-panel p-6 mb-8 border-slate-200 bg-white/80 max-w-xl mx-auto w-full shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Enter Registration Number (e.g. 9921004123)"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#FF6B00] transition-all uppercase placeholder-slate-400"
              />
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A33] hover:from-[#FF8A33] hover:to-[#FF6B00] text-white font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              {loading ? "Searching..." : "Check Status"}
            </button>
          </form>
        </div>

        {/* Result Area */}
        {searched && (
          <div className="flex-grow flex flex-col justify-center max-w-3xl mx-auto w-full">
            {applicant ? (
              <div className="space-y-8 w-full">
                
                {/* Status card */}
                <div className={`p-6 rounded-2xl border bg-gradient-to-r ${getStatusColor(applicant.status)} shadow-sm flex flex-col sm:flex-row items-center gap-4`}>
                  <div className="shrink-0">
                    {applicant.status === "approved" ? (
                      <FaCheckCircle size={40} className="text-emerald-600" />
                    ) : applicant.status === "rejected" ? (
                      <FaTimesCircle size={40} className="text-rose-600" />
                    ) : (
                      <FaHourglassHalf size={40} className="text-amber-600" />
                    )}
                  </div>
                  <div className="text-center sm:text-left flex-grow">
                    <h3 className="text-lg font-bold text-slate-800 leading-snug">
                      {applicant.status === "approved"
                        ? "Congratulations! You have been selected! 🎉"
                        : applicant.status === "rejected"
                        ? "Recruitment Selection Update"
                        : "Application Under Evaluation"}
                    </h3>
                    <p className="text-slate-600 text-xs mt-1 leading-normal max-w-xl">
                      {applicant.status === "approved"
                        ? `You have been selected as a core committee member for the domain of ${applicant.approvedRole || applicant.priority1}. Your official Appointment Order is available below.`
                        : applicant.status === "rejected"
                        ? "Thank you for your time and efforts in the evaluation rounds. Unfortunately, we are unable to accept your application for this academic session."
                        : "We are currently evaluating interview scores and priorities. Your status will update as soon as selections are confirmed. Please keep checking back!"}
                    </p>
                  </div>
                  
                  {/* Immediate Download Button for approved applicants */}
                  {applicant.status === "approved" && (
                    <a
                      href={`/api/download-letter?id=${applicant.id}`}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A33] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all hover:shadow-[0_0_15px_rgba(255,107,0,0.3)] shrink-0 shadow-md cursor-pointer"
                    >
                      <FaDownload size={12} />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>

                {/* Styled Document Preview for Selected Applicants */}
                {applicant.status === "approved" && (
                  <div className="space-y-4">
                    <div className="text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                      — Letter Preview —
                    </div>
                    
                    {/* The Template Letter Panel */}
                    <div className="bg-white text-slate-800 p-8 sm:p-12 rounded-2xl shadow-2xl max-w-2xl mx-auto relative border-[3px] border-double border-[#800000]">
                      
                      {/* Logo and Header */}
                      <div className="text-center border-b-2 border-dashed border-slate-200 pb-5 mb-6">
                        <div className="relative w-16 h-16 mx-auto mb-3 bg-white p-1 border border-slate-200 rounded-lg">
                          <Image
                            src="/csi-logo.jpg"
                            alt="Logo"
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <h2 className="text-xl font-extrabold tracking-wider text-slate-900 leading-none uppercase">
                          CSI KARE STUDENT CHAPTER
                        </h2>
                        <span className="text-[10px] text-slate-500 font-bold block mt-1 tracking-widest uppercase">
                          Kalasalingam Academy of Research and Education, Krishnankoil
                        </span>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between font-mono text-[10.5px] text-slate-600">
                          <span>REF: CSI-KARE-SC-2026-{applicant.registrationNumber.substring(applicant.registrationNumber.length - 4)}</span>
                          <span>DATE: {new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="text-center text-[15px] font-extrabold text-[#800000] tracking-widest uppercase mb-6 decoration-2 underline underline-offset-4">
                        Official Appointment Order
                      </div>

                      {/* Body texts */}
                      <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-slate-700 text-justify">
                        <p className="font-extrabold text-slate-900">Dear {applicant.name},</p>
                        
                        <p>
                          Based on your performance in the recruitment interviews and evaluations held by the Executive Board, we are pleased to inform you that you have been selected to join the core team of <strong>CSI KARE STUDENT CHAPTER</strong> for the academic year 2026-2027.
                        </p>
                        
                        <p>
                          You are hereby appointed to the following position with immediate effect:
                        </p>

                        {/* Details card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-6 space-y-2">
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-semibold">Appointee Name:</span>
                            <span className="text-slate-900 font-bold">{applicant.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-semibold">Assigned Role:</span>
                            <span className="text-[#800000] font-bold">{applicant.approvedRole || applicant.priority1 || "Core Member"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-semibold">Organization:</span>
                            <span className="text-slate-900 font-bold">CSI KARE STUDENT CHAPTER</span>
                          </div>
                        </div>

                        <p>
                          As a core committee member, you will be expected to work collaboratively with your team members, demonstrate leadership quality, and actively contribute to the workshops, technical events, and initiatives organized by the chapter.
                        </p>
                        
                        <p>
                          Please note that onboarding details and task assignments will be coordinated through our WhatsApp group.
                        </p>
                        
                        <p>
                          Congratulations once again! We look forward to an outstanding tenure working together to drive academic and technical excellence.
                        </p>
                      </div>

                      {/* Regards & Signature */}
                      <div className="mt-8 pt-4 flex justify-between items-end">
                        <div>
                          <p className="text-xs text-slate-500 m-0">Regards,</p>
                          <h4 className="text-sm font-extrabold text-slate-900 m-0 leading-tight">
                            CSI KARE STUDENT CHAPTER
                          </h4>
                        </div>
                        
                        <div className="text-center relative w-44">
                          <div className="w-full border-b border-slate-400 mb-1.5">&nbsp;</div>
                          <h4 className="text-[11.5px] font-extrabold text-slate-900 m-0">Dr. P. Pandiselvam</h4>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none mt-0.5">
                            Faculty Coordinator
                          </span>
                        </div>
                      </div>

                    </div>
                    
                    {/* Big Download Button */}
                    <div className="text-center mt-6">
                      <a
                        href={`/api/download-letter?id=${applicant.id}`}
                        className="inline-flex items-center space-x-3 py-4 px-8 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8A33] hover:from-[#FF8A33] hover:to-[#FF6B00] text-white font-extrabold text-sm uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-[0_0_20px_rgba(255,107,0,0.4)] cursor-pointer"
                      >
                        <FaFilePdf size={16} />
                        <span>Download Appointment Order</span>
                      </a>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="glass-panel p-8 border-rose-500/20 bg-rose-50 text-center max-w-md mx-auto w-full shadow-sm">
                <FaTimesCircle className="text-rose-600 mx-auto mb-4" size={44} />
                <h3 className="text-slate-800 font-bold text-lg">No Record Found</h3>
                <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                  We couldn't find any core committee application matching the registration number <strong>{regNo}</strong>. Please ensure the number is spelled correctly and try again.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
