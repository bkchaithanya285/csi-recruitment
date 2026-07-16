"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaCode, FaBrain, FaDatabase, FaGlobe, FaMobileAlt, FaLaptopCode } from "react-icons/fa";

export default function Hero() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let particles = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
        this.alpha = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = "#FF6B00";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const init = () => {
      const count = Math.min(Math.floor(canvas.width / 15), 80);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };
    init();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw links between close particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 107, 0, 0.08)";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] rounded-full bg-[#800000]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-[#FF6B00]/8 blur-[150px] pointer-events-none" />

      {/* Floating Icons */}
      <div className="hidden lg:block absolute inset-0 z-20 pointer-events-none">
        <div className="absolute top-1/4 left-[10%] animate-float text-[#FF6B00]/30"><FaCode size={40} /></div>
        <div className="absolute top-1/3 right-[12%] animate-float-slow text-[#800000]/40"><FaBrain size={44} /></div>
        <div className="absolute bottom-1/3 left-[15%] animate-float-slow text-[#800000]/30"><FaDatabase size={36} /></div>
        <div className="absolute bottom-1/4 right-[15%] animate-float text-[#FF6B00]/30"><FaGlobe size={38} /></div>
        <div className="absolute top-[60%] left-[8%] animate-float text-[#FF6B00]/20"><FaMobileAlt size={34} /></div>
        <div className="absolute top-[20%] right-[30%] animate-float-slow text-[#800000]/25"><FaLaptopCode size={40} /></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 text-center flex flex-col items-center">
        
        {/* Logo Container with Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-48 h-32 mb-8 rounded-2xl overflow-hidden bg-white p-2 border-2 border-[#FF6B00]/30 shadow-[0_0_40px_rgba(255,107,0,0.15)] flex items-center justify-center"
        >
          <Image
            src="/csi-logo.jpg"
            alt="CSI Logo"
            fill
            priority
            sizes="192px"
            className="object-contain p-1"
          />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 max-w-4xl leading-tight"
        >
          <span className="text-slate-800">CSI KARE </span>
          <span className="text-[#800000]">STUDENT CHAPTER</span>
        </motion.h1>
        
        {/* Sub-Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl sm:text-4xl font-bold tracking-widest text-[#FF6B00] mb-6 uppercase"
        >
          Build. Innovate. Lead.
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 px-2"
        >
          Join one of the most active student technical communities where innovation, leadership, technical excellence, teamwork, and professional growth come together.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xl"
        >
          <a
            href="#apply"
            onClick={(e) => handleScrollTo(e, "#apply")}
            className="bg-gradient-to-r from-[#FF6B00] to-[#FF8A33] hover:from-[#FF8A33] hover:to-[#FF6B00] text-white px-8 py-4 rounded-full font-bold text-base transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,107,0,0.4)] hover:-translate-y-1 text-center shadow-md border border-[#FF6B00]/20 cursor-pointer"
          >
            Join Us
          </a>
          <a
            href="#about"
            onClick={(e) => handleScrollTo(e, "#about")}
            className="glass-panel text-slate-700 bg-white/70 hover:bg-slate-50 px-8 py-4 rounded-full font-semibold text-base transition-all duration-300 hover:-translate-y-1 text-center border border-slate-200 hover:border-[#FF6B00]/50 cursor-pointer"
          >
            Learn More
          </a>
          <Link
            href="/status"
            className="py-4 px-8 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white transition-all duration-300 hover:-translate-y-1 text-center font-bold text-base shadow-md cursor-pointer"
          >
            Check Status
          </Link>
        </motion.div>

      </div>

      {/* Decorative Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-[60px] fill-[#F8F9FA]/30"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.3,87.43,26.24,153.25,43.51,225.4,59.35,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
}
