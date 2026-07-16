"use client";

import { 
  FaLaptopCode, 
  FaBrain, 
  FaCogs, 
  FaPenNib, 
  FaInstagram, 
  FaVideo, 
  FaCalendarAlt, 
  FaBullhorn 
} from "react-icons/fa";

const ROLES = [
  {
    name: "Web Development Team",
    icon: FaLaptopCode,
    desc: "Design, build, and maintain our web application portals. Work with modern tech stacks like Next.js, React, and Tailwind CSS to implement outstanding responsive user interfaces."
  },
  {
    name: "AI & Machine Learning Team",
    icon: FaBrain,
    desc: "Explore artificial intelligence and machine learning technologies. Conduct workshops, collaborate on research, and build intelligent applications that solve complex problems."
  },
  {
    name: "Technical Team",
    icon: FaCogs,
    desc: "Oversee the society's technical activities, execute coding competitions, organize hackathons, and maintain technical infrastructure and developer tooling."
  },
  {
    name: "Content Team",
    icon: FaPenNib,
    desc: "Draft professional copy for social media posts, design newsletters, write technical blog articles, and prepare official correspondence and documentation."
  },
  {
    name: "Social Media Team",
    icon: FaInstagram,
    desc: "Manage our public profiles on Instagram, LinkedIn, and YouTube. Plan marketing campaigns, design creative visual content, and grow our student engagement."
  },
  {
    name: "Video Editing Team",
    icon: FaVideo,
    desc: "Produce event trailers, edit workshop recordings, create aesthetic promotional reels, and manage all video production assets for CSI KARE STUDENT CHAPTER."
  },
  {
    name: "Event Coordinators",
    icon: FaCalendarAlt,
    desc: "Plan and host our workshops, webinars, hackathons, and talks. Manage scheduling, arrange venue logistics, coordinate on-stage actions, and verify event success."
  },
  {
    name: "PR & Outreach Team",
    icon: FaBullhorn,
    desc: "Drive external relations. Connect with industry speakers, coordinate sponsorships, organize collaborative sessions with other branches, and manage student outreach."
  }
];

export default function Roles() {
  return (
    <section id="roles" className="py-24 relative overflow-hidden bg-transparent">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/3 left-0 w-[35vw] h-[35vw] rounded-full bg-[#800000]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-[35vw] h-[35vw] rounded-full bg-[#FF6B00]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20" data-aos="fade-up">
          <h2 className="text-xs font-bold tracking-widest text-[#FF6B00] uppercase mb-2">
            Explore Opportunities
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-slate-800 mb-6">
            Available Roles
          </h3>
          <p className="text-slate-600 text-base sm:text-lg">
            Choose from a wide variety of domains. We encourage applicants to select exactly 3 roles based on their interests and career plans.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ROLES.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div
                key={role.name}
                className="glass-panel p-6 flex flex-col justify-between border-slate-200 bg-white/80 hover:border-[#FF6B00]/30 shadow-sm hover:shadow-md transition-all duration-300"
                data-aos="fade-up"
                data-aos-delay={idx * 50}
              >
                <div>
                  {/* Icon Badge */}
                  <div className="p-3 w-fit rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 mb-5 shadow-[0_0_15px_rgba(255,107,0,0.05)]">
                    <Icon size={22} />
                  </div>
                  
                  <h4 className="text-slate-800 font-extrabold text-base tracking-wide mb-3">
                    {role.name}
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {role.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
