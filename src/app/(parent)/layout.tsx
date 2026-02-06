"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { APP_VERSION } from "../../lib/version";
import { PinModal } from "../../components/pin/PinModal";

const PIN_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hasPin = useQuery(api.families.hasParentPin);
  const ensureUser = useMutation(api.users.ensureUser);
  const userEnsured = useRef(false);

  const [isVerified, setIsVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Ensure user exists in Convex (same as dashboard layout)
  useEffect(() => {
    if (hasPin !== undefined && !userEnsured.current) {
      userEnsured.current = true;
      ensureUser().catch(() => {
        // User might already exist, ignore errors
      });
    }
  }, [hasPin, ensureUser]);

  // Check if session is still valid (within 15 min timeout)
  const checkSession = useCallback(() => {
    const lastActivity = localStorage.getItem("parentModeLastActivity");
    if (!lastActivity) return false;

    const elapsed = Date.now() - parseInt(lastActivity, 10);
    return elapsed < PIN_TIMEOUT_MS;
  }, []);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    localStorage.setItem("parentModeLastActivity", Date.now().toString());
  }, []);

  // Initial session check
  useEffect(() => {
    if (hasPin === undefined) return; // Still loading

    if (hasPin === false) {
      // No PIN set, need to set one
      setShowPinModal(true);
      setIsVerified(false);
    } else if (checkSession()) {
      // Session still valid
      setIsVerified(true);
      updateActivity();
    } else {
      // Need to verify PIN
      setShowPinModal(true);
      setIsVerified(false);
    }
    setIsCheckingSession(false);
  }, [hasPin, checkSession, updateActivity]);

  // Activity tracking - update on user interaction
  useEffect(() => {
    if (!isVerified) return;

    const handleActivity = () => updateActivity();

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [isVerified, updateActivity]);

  // Periodic timeout check
  useEffect(() => {
    if (!isVerified) return;

    const interval = setInterval(() => {
      if (!checkSession()) {
        setIsVerified(false);
        setShowPinModal(true);
      }
    }, ACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isVerified, checkSession]);

  const handlePinSuccess = useCallback(() => {
    updateActivity();
    setIsVerified(true);
    setShowPinModal(false);
  }, [updateActivity]);

  const handleCancel = useCallback(() => {
    // Redirect back to dashboard if they cancel
    window.location.href = "/dashboard";
  }, []);

  const navItems = [
    { href: "/parent", label: "סקירה כללית", icon: "dashboard" },
    { href: "/parent/children", label: "ניהול ילדים", icon: "people" },
    { href: "/parent/tasks", label: "ניהול משימות", icon: "task_alt" },
    { href: "/parent/add-points", label: "הוספת נקודות", icon: "add_circle" },
    { href: "/parent/reduce-points", label: "הורדת נקודות", icon: "remove_circle" },
    { href: "/parent/rewards", label: "ניהול פרסים", icon: "card_giftcard" },
    { href: "/parent/reports", label: "דוחות", icon: "analytics" },
    { href: "/parent/settings", label: "הגדרות", icon: "settings" },
  ];

  // Show loading while checking session
  if (isCheckingSession || hasPin === undefined) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a29bfe]"></div>
      </div>
    );
  }

  // Show PIN modal if not verified
  if (showPinModal) {
    return (
      <div className="min-h-screen bg-[#f0f0f5]">
        <PinModal
          mode={hasPin ? "verify" : "setup"}
          onSuccess={handlePinSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f5]">
      {/* Header */}
      <header className="bg-[#a29bfe] text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/parent" className="text-2xl font-bold">
              מצב הורה 👨‍👩‍👧‍👦
            </Link>
            <span className="text-[10px] text-white/50 font-mono">v{APP_VERSION}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              חזרה למסך ילדים
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="container mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 pb-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-xl whitespace-nowrap transition-all ${
                  pathname === item.href
                    ? "bg-[#f0f0f5] text-[#a29bfe] font-bold"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-400 text-sm">
        <p>v{APP_VERSION}</p>
      </footer>
    </div>
  );
}
