"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaInstagram, FaLinkedin, FaArrowUp } from "react-icons/fa";

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const navbarHeight = 80;
      const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="glass-panel border-x-0 border-b-0 rounded-none mt-20 relative bg-white/75 backdrop-blur-md border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-16 h-12 overflow-hidden rounded-lg bg-white p-0.5 border border-[#800000]/20 flex items-center justify-center">
                <Image
                  src="/csi-logo.jpg"
                  alt="CSI Logo"
                  fill
                  sizes="64px"
                  className="object-contain p-0.5"
                />
              </div>
              <div>
                <h3 className="text-slate-800 font-bold text-base tracking-wider">
                  CSI KARE
                </h3>
                <p className="text-[11px] text-[#FF6B00] font-semibold tracking-wider uppercase">
                  STUDENT CHAPTER
                </p>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
              Empowering students through innovation, technology, leadership, and professional excellence.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="text-slate-800 font-bold text-base">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="#home"
                onClick={(e) => handleScrollTo(e, "#home")}
                className="text-slate-600 hover:text-[#FF6B00] text-sm transition-colors duration-200"
              >
                Home
              </a>
              <a
                href="#about"
                onClick={(e) => handleScrollTo(e, "#about")}
                className="text-slate-600 hover:text-[#FF6B00] text-sm transition-colors duration-200"
              >
                About
              </a>
              <a
                href="#process"
                onClick={(e) => handleScrollTo(e, "#process")}
                className="text-slate-600 hover:text-[#FF6B00] text-sm transition-colors duration-200"
              >
                Recruitment Process
              </a>
              <a
                href="#roles"
                onClick={(e) => handleScrollTo(e, "#roles")}
                className="text-slate-600 hover:text-[#FF6B00] text-sm transition-colors duration-200"
              >
                Roles
              </a>
              <a
                href="#apply"
                onClick={(e) => handleScrollTo(e, "#apply")}
                className="text-slate-600 hover:text-[#FF6B00] text-sm transition-colors duration-200"
              >
                Apply Now
              </a>
              <a
                href="#contact"
                onClick={(e) => handleScrollTo(e, "#contact")}
                className="text-slate-600 hover:text-[#FF6B00] text-sm transition-colors duration-200"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Connect Column */}
          <div className="space-y-4">
            <h4 className="text-slate-800 font-bold text-base">Follow Us</h4>
            <p className="text-slate-600 text-sm">
              Stay updated with our latest workshops, hackathons, and announcements.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/csi_kare?igsh=bXhtNXd6anRhaXVw"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-[#FF6B00] hover:border-[#FF6B00]/40 transition-all duration-300 border border-slate-200 hover:shadow-[0_0_15px_rgba(255,107,0,0.2)] shadow-sm cursor-pointer"
                title="Follow us on Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/csi-kare/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-[#FF6B00] hover:border-[#FF6B00]/40 transition-all duration-300 border border-slate-200 hover:shadow-[0_0_15px_rgba(255,107,0,0.2)] shadow-sm cursor-pointer"
                title="Follow us on LinkedIn"
              >
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-slate-200 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <p className="mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} CSI KARE STUDENT CHAPTER. All rights reserved.
          </p>
          <p className="flex items-center">
            Built with <span className="text-red-500 mx-1">❤️</span> by Web Team &mdash; CSI KARE STUDENT CHAPTER
          </p>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8A33] hover:from-[#FF8A33] hover:to-[#FF6B00] text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(255,107,0,0.5)] cursor-pointer ${
          showScrollTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Back to Top"
      >
        <FaArrowUp size={18} />
      </button>
    </footer>
  );
}
