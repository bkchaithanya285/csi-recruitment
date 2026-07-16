import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AosInit from "@/components/AosInit";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "CSI KARE STUDENT CHAPTER - Recruitment Portal",
  description: "Join CSI KARE STUDENT CHAPTER, one of the most active student technical communities. Build. Innovate. Lead.",
  icons: {
    icon: "/csi-logo.jpg",
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#F8F9FA] text-[#1E293B] font-sans selection:bg-[#800000]/10 selection:text-[#800000] relative">
        {/* Animated Glow Background Layers */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-glow-maroon filter blur-3xl animate-glow-1" />
          <div className="absolute bottom-[-10%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-glow-orange filter blur-3xl animate-glow-2" />
        </div>
        
        <ToastProvider>
          <AuthProvider>
            <AosInit />
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
