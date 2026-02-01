"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useChild } from "../../../../contexts/ChildContext";

export default function AchievementsPage() {
  const { selectedChild, children, isLoading } = useChild();
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const achievements = useQuery(
    api.achievements.getByChild,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  const achievementCount = useQuery(
    api.achievements.getCount,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  if (isLoading || !children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a29bfe]"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold mb-2">אין הישגים עדיין</h2>
        <p className="text-gray-500 mb-6">הוסף ילד ראשון כדי להתחיל</p>
        <a
          href="/dashboard"
          className="inline-block bg-[#22d1c6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1db8ae] transition-colors"
        >
          חזור לדף הבית
        </a>
      </div>
    );
  }

  if (!selectedChild) {
    return null;
  }

  const filteredAchievements = achievements?.filter((a) => {
    if (filter === "unlocked") return a.isUnlocked;
    if (filter === "locked") return !a.isUnlocked;
    return true;
  });

  // Group by category
  const categories = [
    { id: "tasks", name: "משימות", icon: "✅" },
    { id: "streak", name: "רצף", icon: "🔥" },
    { id: "points", name: "נקודות", icon: "💰" },
    { id: "level", name: "רמות", icon: "📈" },
    { id: "special", name: "מיוחדים", icon: "⭐" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-[#a29bfe] to-[#6c5ce7] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80">הישגים שנפתחו</div>
            <div className="text-4xl font-bold">
              {achievementCount?.unlocked ?? 0}/{achievementCount?.total ?? 0}
            </div>
          </div>
          <div className="text-6xl">🏆</div>
        </div>
        <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{
              width: `${
                achievementCount
                  ? (achievementCount.unlocked / achievementCount.total) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-[#a29bfe] text-white"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          הכל
        </button>
        <button
          onClick={() => setFilter("unlocked")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            filter === "unlocked"
              ? "bg-[#a29bfe] text-white"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          נפתחו ✨
        </button>
        <button
          onClick={() => setFilter("locked")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            filter === "locked"
              ? "bg-[#a29bfe] text-white"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          נעולים 🔒
        </button>
      </div>

      {/* Achievements by Category */}
      {categories.map((category) => {
        const categoryAchievements = filteredAchievements?.filter(
          (a) => a.category === category.id
        );
        if (!categoryAchievements || categoryAchievements.length === 0)
          return null;

        return (
          <div key={category.id} className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              {category.name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl text-center transition-all ${
                    achievement.isUnlocked
                      ? "bg-gradient-to-br from-[#a29bfe]/10 to-[#6c5ce7]/10 border-2 border-[#a29bfe]"
                      : "bg-gray-100 opacity-60"
                  }`}
                >
                  <div
                    className={`text-4xl mb-2 ${
                      achievement.isUnlocked ? "" : "grayscale"
                    }`}
                  >
                    {achievement.isUnlocked ? achievement.icon : "🔒"}
                  </div>
                  <div className="font-bold text-sm">{achievement.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {achievement.description}
                  </div>
                  {achievement.isUnlocked && achievement.unlockedAt && (
                    <div className="text-xs text-[#a29bfe] mt-2">
                      נפתח ב-{" "}
                      {new Date(achievement.unlockedAt).toLocaleDateString("he-IL")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filteredAchievements?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🏆</div>
          <p>אין הישגים להציג</p>
        </div>
      )}
    </div>
  );
}
