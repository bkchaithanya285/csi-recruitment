"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { FaLock, FaUser, FaSignOutAlt, FaShieldAlt, FaSpinner } from "react-icons/fa";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const { user, loading, isAdmin, login, logout } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("Please enter both email and password.", "warning");
      return;
    }
    setSigningIn(true);
    try {
      await login(email, password);
      addToast("Signed in successfully!", "success");
    } catch (error) {
      console.error("Login error:", error);
      addToast("Invalid email or password.", "error");
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0000]">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="animate-spin text-[#FF6B00] text-4xl" />
          <p className="text-slate-400 text-sm font-semibold tracking-wider">
            Loading Admin Portal...
          </p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Login Screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0000] px-4 relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-[#800000]/10 blur-[130px] pointer-events-none" />
        
        <div className="glass-panel-dark p-8 w-full max-w-md border-white/10 bg-[#1E0000]/20 shadow-2xl relative z-10" data-aos="fade-up">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#800000]/15 text-[#FF6B00] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#800000]/20 shadow-[0_0_15px_rgba(255,107,0,0.15)]">
              <FaLock size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Admin Portal
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 font-medium">
              Secure Access &mdash; CSI KARE STUDENT CHAPTER
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex flex-col">
              <label className="text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="email"
                  placeholder="admin@csikare.org"
                  className="bg-[#0F0000] border border-white/10 pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 w-full transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="bg-[#0F0000] border border-white/10 pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 w-full transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A33] hover:from-[#FF8A33] hover:to-[#FF6B00] text-white font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] hover:-translate-y-0.5 border border-[#FF6B00]/25 cursor-pointer"
            >
              {signingIn ? "Verifying Credentials..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Authenticated but Unauthorized Warning Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0000] px-4 relative overflow-hidden">
        <div className="glass-panel-dark p-8 w-full max-w-md border-rose-500/20 bg-rose-950/5 shadow-2xl text-center relative z-10" data-aos="fade-up">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <FaShieldAlt size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide mb-2">
            Unauthorized Access
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Your account (<strong>{user.email}</strong>) is not registered in our admin database. Contact a student coordinator to get authorization.
          </p>
          <button
            onClick={() => logout()}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer border border-rose-500/25"
          >
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard
  return <AdminDashboard logout={logout} userEmail={user.email} />;
}
