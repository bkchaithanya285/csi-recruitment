"use client";

import { 
  FaAward, 
  FaLaptopCode, 
  FaHandshake, 
  FaFileAlt, 
  FaGlobeAmericas, 
  FaLightbulb, 
  FaUsers, 
  FaCertificate, 
  FaChartLine 
} from "react-icons/fa";

const PERKS = [
  { title: "Leadership Experience", icon: FaAward, desc: "Lead projects, run events, and develop critical organizational skills." },
  { title: "Technical Skill Development", icon: FaLaptopCode, desc: "Gain hands-on coding, architecture, design, and engineering skills." },
  { title: "Networking Opportunities", icon: FaHandshake, desc: "Connect with industry professionals, seniors, alumni, and peers." },
  { title: "Resume Building", icon: FaFileAlt, desc: "Enhance your profile with prestigious CSI events and role experiences." },
  { title: "Industry Exposure", icon: FaGlobeAmericas, desc: "Stay updated on the latest industrial demands, workshops, and trends." },
  { title: "Innovation", icon: FaLightbulb, desc: "Bring original ideas to life with resources, mentoring, and support." },
  { title: "Team Collaboration", icon: FaUsers, desc: "Work in multidisciplinary teams to build collaborative tools & web apps." },
  { title: "Certificates", icon: FaCertificate, desc: "Get officially recognized for your contributions and event milestones." },
  { title: "Professional Growth", icon: FaChartLine, desc: "Build soft skills, presenting abilities, confidence, and career readiness." }
];

export default function WhyJoin() {
  return (
    <section className="py-24 relative overflow-hidden bg-transparent">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-10 left-10 w-[20vw] h-[20vw] rounded-full bg-[#800000]/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[30vw] h-[30vw] rounded-full bg-[#FF6B00]/8 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
          <h2 className="text-xs font-bold tracking-widest text-[#FF6B00] uppercase mb-2">
            Perks & Benefits
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-slate-800 mb-6">
            Why Join Us?
          </h3>
          <p className="text-slate-600 text-base sm:text-lg">
            Being a part of CSI KARE STUDENT CHAPTER is more than just a membership. It is an incubator for your future career.
          </p>
        </div>

        {/* Perks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PERKS.map((perk, idx) => {
            const Icon = perk.icon;
            return (
              <div
                key={perk.title}
                className="glass-panel p-8 border-slate-200 bg-white/80 hover:border-[#FF6B00]/30 shadow-sm hover:shadow-md transition-all duration-300"
                data-aos="fade-up"
                data-aos-delay={idx * 50}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                    <Icon size={24} />
                  </div>
                  <h4 className="text-slate-800 font-extrabold text-lg tracking-wide">
                    {perk.title}
                  </h4>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {perk.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
