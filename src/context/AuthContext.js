"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Dev session fallback check
    if (typeof window !== "undefined") {
      const devSession = sessionStorage.getItem("devAdminSession");
      if (devSession) {
        const parsedUser = JSON.parse(devSession);
        setUser(parsedUser);
        setIsAdmin(true);
        setLoading(false);
        return;
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && firebaseUser.email) {
        const adminEmailsStr = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
        const adminEmails = adminEmailsStr
          .split(",")
          .map((e) => e.trim().toLowerCase());
        const userEmail = firebaseUser.email.toLowerCase();
        
        setIsAdmin(adminEmails.includes(userEmail));
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    // Check for dev fallback credentials first
    if (email === "admin@csikare.org" && password === "admin123") {
      const mockUser = {
        uid: "mock-admin-uid",
        email: "admin@csikare.org",
        displayName: "Mock Admin"
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("devAdminSession", JSON.stringify(mockUser));
      }
      setUser(mockUser);
      setIsAdmin(true);
      return mockUser;
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("devAdminSession");
    }
    setUser(null);
    setIsAdmin(false);
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
