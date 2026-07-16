"use client";

import { FaRegFileAlt, FaSearch, FaUserTie, FaUserCheck, FaAward } from "react-icons/fa";

const STEPS = [
  {
    step: "Step 1",
    title: "Fill Application Form",
    icon: FaRegFileAlt,
    desc: "Complete the online application form below by entering your details, selecting and priority-ranking exactly 3 preferred roles, and joining our official WhatsApp group.",
  },
  {
    step: "Step 2",
    title: "Application Screening",
    icon: FaSearch,
    desc: "Our core team reviews every single application. Candidates are screened based on their interests, experiences, motivation, and role fitment.",
  },
  {
    step: "Step 3",
    title: "Interaction / Interview",
    icon: FaUserTie,
    desc: "Shortlisted candidates will be invited for a friendly interaction. It is an opportunity for us to learn about your skills and for you to ask questions.",
  },
  {
    step: "Step 4",
    title: "Selection",
    icon: FaUserCheck,
    desc: "Final selection is made based on the screening and interview interaction. Selected applicants will receive an official notification.",
  },
  {
    step: "Step 5",
    title: "Welcome to CSI KARE",
    icon: FaAward,
    desc: "Welcome to CSI KARE STUDENT CHAPTER! Get onboarded, meet the teams, receive your membership updates, and start building and leading!",
  },
];

export default function Process() {
  return (
    <section id="process" className="py-24 relative overflow-hidden bg-transparent">
      
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[40vw] h-[40vw] rounded-full bg-[#800000]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20" data-aos="fade-up">
          <h2 className="text-xs font-bold tracking-widest text-[#FF6B00] uppercase mb-2">
            The Journey
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-slate-800 mb-6">
            Recruitment Process
          </h3>
          <p className="text-slate-600 text-base sm:text-lg">
            A simple, transparent, and comprehensive evaluation path designed to help us find the best fit for our teams.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative wrap overflow-hidden p-2 sm:p-10">
          
          {/* Vertical Timeline Center Line */}
          <div className="absolute left-[30px] md:left-1/2 h-full w-[2px] bg-gradient-to-b from-[#800000] via-[#FF6B00] to-transparent -translate-x-1/2 pointer-events-none z-10" />

          {/* Timeline Steps */}
          <div className="space-y-12 md:space-y-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={step.step}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between w-full relative z-20 ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Spacing card placeholder for desktop */}
                  <div className="hidden md:block w-5/12" />

                  {/* Timeline Dot/Icon */}
                  <div className="absolute left-[30px] md:left-1/2 -translate-x-1/2 w-[44px] h-[44px] rounded-full bg-white border-2 border-[#FF6B00] flex items-center justify-center text-[#FF6B00] z-30 shadow-[0_0_15px_rgba(255,107,0,0.2)] timeline-dot">
                    <Icon size={18} />
                  </div>

                  {/* Content Card */}
                  <div
                    className="w-full md:w-5/12 pl-[70px] md:pl-0"
                    data-aos={isEven ? "fade-left" : "fade-right"}
                    data-aos-delay={idx * 50}
                  >
                    <div className="glass-panel p-6 md:p-8 border-slate-200 bg-white/80 hover:border-[#FF6B00]/30 shadow-sm hover:shadow-md transition-all duration-300 relative">
                      {/* Top Corner Badge */}
                      <span className="absolute top-4 right-4 text-xs font-bold uppercase tracking-widest text-[#FF6B00]/70 bg-[#FF6B00]/10 px-2.5 py-1 rounded-full border border-[#FF6B00]/15">
                        {step.step}
                      </span>
                      
                      <h4 className="text-slate-800 font-extrabold text-xl mb-3 pr-16 tracking-wide">
                        {step.title}
                      </h4>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
