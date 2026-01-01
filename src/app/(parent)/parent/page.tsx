"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";

export default function ParentDashboard() {
  const children = useQuery(api.children.listByFamily);
  const family = useQuery(api.users.getUserFamily);

  if (!children || !family) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a29bfe]"></div>
      </div>
    );
  }

  const totalPoints = children.reduce((sum, child) => sum + child.totalPoints, 0);
  const totalTasks = children.reduce(
    (sum, child) => sum + child.totalTasksCompleted,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">שלום, {family.name} 👋</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-4xl mb-2">👶</div>
          <div className="text-3xl font-bold text-[#a29bfe]">
            {children.length}
          </div>
          <div className="text-gray-500">ילדים</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-3xl font-bold text-[#22d1c6]">{totalPoints}</div>
          <div className="text-gray-500">סה״כ נקודות</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-3xl font-bold text-[#95e1d3]">{totalTasks}</div>
          <div className="text-gray-500">משימות הושלמו</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-3xl font-bold text-[#ff6b6b]">
            {Math.max(...children.map((c) => c.currentStreak), 0)}
          </div>
          <div className="text-gray-500">רצף מקסימלי</div>
        </div>
      </div>

      {/* Children Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">סטטוס הילדים</h2>
        <div className="space-y-4">
          {children.map((child) => (
            <div
              key={child._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{child.avatar}</span>
                <div>
                  <div className="font-bold">{child.name}</div>
                  <div className="text-sm text-gray-500">
                    רצף: {child.currentStreak} ימים
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-[#22d1c6]">
                  {child.totalPoints} נקודות
                </div>
                <div className="text-sm text-gray-500">
                  {child.totalTasksCompleted} משימות
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/parent/reduce-points"
          className="bg-[#ff6b6b] text-white rounded-2xl p-6 hover:shadow-lg transition-all card-hover"
        >
          <span className="material-symbols-outlined text-4xl mb-2">
            remove_circle
          </span>
          <div className="font-bold text-lg">הורדת נקודות</div>
          <div className="text-white/80 text-sm">
            הורד נקודות מילד עם הסבר
          </div>
        </Link>

        <Link
          href="/parent/children"
          className="bg-[#a29bfe] text-white rounded-2xl p-6 hover:shadow-lg transition-all card-hover"
        >
          <span className="material-symbols-outlined text-4xl mb-2">people</span>
          <div className="font-bold text-lg">ניהול ילדים</div>
          <div className="text-white/80 text-sm">
            הוסף, ערוך או מחק פרופילי ילדים
          </div>
        </Link>

        <Link
          href="/parent/rewards"
          className="bg-[#ffd93d] text-gray-800 rounded-2xl p-6 hover:shadow-lg transition-all card-hover"
        >
          <span className="material-symbols-outlined text-4xl mb-2">
            card_giftcard
          </span>
          <div className="font-bold text-lg">ניהול פרסים</div>
          <div className="text-gray-600 text-sm">
            הגדר פרסים מותאמים אישית
          </div>
        </Link>
      </div>
    </div>
  );
}
