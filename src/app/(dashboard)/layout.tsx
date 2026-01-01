"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useQuery(api.users.getCurrentUser);
  const family = useQuery(api.users.getUserFamily);
  const children_list = useQuery(api.children.listByFamily);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "ראשי", icon: "home" },
    { href: "/dashboard/tasks", label: "משימות", icon: "task_alt" },
    { href: "/dashboard/shop", label: "חנות", icon: "storefront" },
    { href: "/dashboard/achievements", label: "הישגים", icon: "emoji_events" },
    { href: "/dashboard/reports", label: "דוחות", icon: "bar_chart" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-2xl font-bold text-[#22d1c6]">
              משימות ילדים 🌟
            </Link>
            {family && (
              <span className="text-gray-500 text-sm hidden md:block">
                {family.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-gray-600">
                notifications
              </span>
            </button>

            {/* Parent Mode Link */}
            <Link
              href="/parent"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#a29bfe] text-white rounded-full hover:bg-[#8b84e8] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                supervisor_account
              </span>
              מצב הורה
            </Link>

            {/* User Button */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 ${
                pathname === item.href
                  ? "text-[#22d1c6]"
                  : "text-gray-500 hover:text-[#22d1c6]"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar would go here if needed */}
    </div>
  );
}
