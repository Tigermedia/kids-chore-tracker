"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_VERSION } from "../../lib/version";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userEnsured, setUserEnsured] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<Id<"children"> | null>(null);
  const user = useQuery(api.users.getCurrentUser);
  const family = useQuery(api.users.getUserFamily);
  const children_list = useQuery(api.children.listByFamily);
  const pathname = usePathname();
  const ensureUser = useMutation(api.users.ensureUser);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Get first child for notifications if none selected
  const activeChildId = selectedChildId || children_list?.[0]?._id;

  const unreadNotifications = useQuery(
    api.notifications.getUnread,
    activeChildId ? { childId: activeChildId } : "skip"
  );

  const unreadCount = unreadNotifications?.length ?? 0;

  // Ensure user and family exist (fallback if webhook didn't work)
  useEffect(() => {
    // user is undefined while loading, null when doesn't exist
    // Only run ensureUser when we're sure user doesn't exist (user === null)
    if (user === null && !userEnsured) {
      ensureUser()
        .then(() => setUserEnsured(true))
        .catch(console.error);
    }
    // Also set userEnsured to true if user already exists
    if (user !== undefined && user !== null && !userEnsured) {
      setUserEnsured(true);
    }
  }, [user, userEnsured, ensureUser]);

  const navItems = [
    { href: "/dashboard", label: "ראשי", icon: "home" },
    { href: "/dashboard/tasks", label: "משימות", icon: "task_alt" },
    { href: "/dashboard/shop", label: "חנות", icon: "storefront" },
    { href: "/dashboard/achievements", label: "הישגים", icon: "emoji_events" },
    { href: "/parent", label: "הורה", icon: "supervisor_account" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-2xl font-bold text-[#22d1c6]">
              כוכבים ⭐
            </Link>
            {family && (
              <span className="text-gray-500 text-sm hidden md:block">
                {family.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-gray-600">
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border z-50 max-h-96 overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold">התראות</h3>
                    {unreadCount > 0 && activeChildId && (
                      <button
                        onClick={() => markAllAsRead({ childId: activeChildId })}
                        className="text-sm text-[#22d1c6] hover:underline"
                      >
                        סמן הכל כנקרא
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {unreadNotifications && unreadNotifications.length > 0 ? (
                      unreadNotifications.map((notification) => (
                        <div
                          key={notification._id}
                          className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => markAsRead({ notificationId: notification._id })}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">
                              {notification.type === "point_reduction" && "⚠️"}
                              {notification.type === "achievement" && "🏆"}
                              {notification.type === "level_up" && "⬆️"}
                              {notification.type === "reward_available" && "🎁"}
                              {notification.type === "challenge_complete" && "🎯"}
                              {notification.type === "streak_reminder" && "🔥"}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{notification.title}</div>
                              <div className="text-xs text-gray-500">{notification.message}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString("he-IL")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <div className="text-4xl mb-2">🔔</div>
                        <p>אין התראות חדשות</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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

      {/* Footer */}
      <footer className="hidden md:block text-center py-4 text-gray-400 text-sm">
        <p>v{APP_VERSION}</p>
      </footer>
    </div>
  );
}
