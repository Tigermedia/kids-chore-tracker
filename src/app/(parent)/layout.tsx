"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_VERSION } from "../../lib/version";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/parent", label: "סקירה כללית", icon: "dashboard" },
    { href: "/parent/children", label: "ניהול ילדים", icon: "people" },
    { href: "/parent/reduce-points", label: "הורדת נקודות", icon: "remove_circle" },
    { href: "/parent/rewards", label: "ניהול פרסים", icon: "card_giftcard" },
    { href: "/parent/reports", label: "דוחות", icon: "analytics" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f5]">
      {/* Header */}
      <header className="bg-[#a29bfe] text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/parent" className="text-2xl font-bold">
              מצב הורה 👨‍👩‍👧‍👦
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              חזרה למסך ילדים
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 border-2 border-white",
                },
              }}
            />
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
