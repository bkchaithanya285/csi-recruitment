"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";

const NAV_LINKS = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "//#about" },
  { label: "Recruitment Process", href: "/#process" },
  { label: "Roles", href: "/#roles" },
  { label: "Check Status", href: "/status" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (e, href) => {
    const isHash = href.includes("#");
    const hash = isHash ? href.substring(href.indexOf("#")) : "";
    const isStatus = href === "/status";

    if (isStatus) {
      setIsOpen(false);
      return;
    }

    if (isHash) {
      const isHomepage = window.location.pathname === "/" || window.location.pathname === "";
      if (isHomepage) {
        e.preventDefault();
        setIsOpen(false);
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          const navbarHeight = 80;
          const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - navbarHeight,
            behavior: "smooth",
          });
        }
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-navbar py-3 shadow-lg shadow-black/10"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link href="/#home" className="flex items-center space-x-3 group" onClick={(e) => handleScrollTo(e, "/#home")}>
            <div className="relative w-14 h-10 overflow-hidden rounded-lg bg-white p-0.5 border border-[#800000]/30 group-hover:border-[#FF6B00] transition-colors duration-300 flex items-center justify-center">
              <Image
                src="/csi-logo.jpg"
                alt="CSI Logo"
                fill
                sizes="56px"
                priority
                className="object-contain p-0.5"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-slate-800 leading-none">
                CSI KARE
              </span>
              <span className="text-[10px] text-[#FF6B00] font-semibold tracking-widest leading-normal">
                STUDENT CHAPTER
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#FF6B00] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            <Link
              href="/#apply"
              onClick={(e) => handleScrollTo(e, "/#apply")}
              className="bg-gradient-to-r from-[#FF6B00] to-[#FF8A33] hover:from-[#FF8A33] hover:to-[#FF6B00] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] hover:-translate-y-0.5 border border-[#FF6B00]/25 shadow-sm"
            >
              Apply Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-md transition-colors"
              aria-label="Toggle Menu"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden fixed inset-x-0 top-[76px] bottom-0 z-40 bg-[#F8F9FA]/98 backdrop-blur-lg border-t border-slate-200 transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-8 pb-6 space-y-6 flex flex-col items-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="text-slate-600 hover:text-slate-900 font-medium text-lg tracking-wide transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#apply"
            onClick={(e) => handleScrollTo(e, "/#apply")}
            className="w-full max-w-xs text-center bg-gradient-to-r from-[#FF6B00] to-[#FF8A33] text-white px-6 py-3 rounded-full text-base font-semibold transition-all duration-200 border border-[#FF6B00]/25"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
