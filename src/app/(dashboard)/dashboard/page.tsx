"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { DailyRewardCard } from "../../../components/dashboard/DailyRewardCard";
import { WeeklyChallengeCard } from "../../../components/dashboard/WeeklyChallengeCard";
import { useChild } from "../../../contexts/ChildContext";

// Level definitions
const LEVELS = [
  { name: "מתחיל", icon: "🌱", xpRequired: 0 },
  { name: "צמיחה", icon: "🌿", xpRequired: 100 },
  { name: "חזק", icon: "💪", xpRequired: 250 },
  { name: "מנהיג", icon: "👑", xpRequired: 450 },
  { name: "חוקר", icon: "🔍", xpRequired: 700 },
  { name: "שגריר", icon: "🎖️", xpRequired: 1000 },
  { name: "בעל כישרון", icon: "⭐", xpRequired: 1350 },
  { name: "גיבור", icon: "🦸", xpRequired: 1750 },
  { name: "קורא כוכב", icon: "🚀", xpRequired: 2200 },
  { name: "אגדה", icon: "👑", xpRequired: 3000 },
];

function calculateLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return i;
    }
  }
  return 0;
}

function getNextLevelXP(xp: number) {
  const level = calculateLevel(xp);
  if (level >= LEVELS.length - 1) return LEVELS[LEVELS.length - 1].xpRequired;
  return LEVELS[level + 1].xpRequired;
}

export default function DashboardPage() {
  const router = useRouter();
  const { selectedChild, children, isLoading } = useChild();

  const initWeeklyChallenge = useMutation(
    api.challenges.initializeWeeklyChallenge
  );

  // Redirect to parent area if no children
  useEffect(() => {
    if (children && children.length === 0) {
      router.push("/parent/children");
    }
  }, [children, router]);

  // Auto-initialize weekly challenge when child is selected
  useEffect(() => {
    if (selectedChild) {
      initWeeklyChallenge({ childId: selectedChild._id }).catch(() => {
        // Ignore errors - challenge may already exist
      });
    }
  }, [selectedChild?._id, initWeeklyChallenge]);

  if (isLoading || !children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22d1c6]"></div>
      </div>
    );
  }

  // Show loading while redirecting
  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22d1c6] mx-auto mb-4"></div>
          <p className="text-gray-500">מעביר למצב הורה...</p>
        </div>
      </div>
    );
  }

  if (!selectedChild) {
    return null;
  }

  const level = calculateLevel(selectedChild.xp);
  const currentLevelXP = LEVELS[level].xpRequired;
  const nextLevelXP = getNextLevelXP(selectedChild.xp);
  const xpProgress =
    nextLevelXP > currentLevelXP
      ? ((selectedChild.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
      : 100;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {selectedChild && (
        <>
          {/* Daily Reward */}
          <DailyRewardCard
            childId={selectedChild._id}
            theme={selectedChild.theme}
          />

          {/* Weekly Challenge */}
          <WeeklyChallengeCard
            childId={selectedChild._id}
            theme={selectedChild.theme}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className="bg-white rounded-2xl p-4 shadow-sm"
              style={{ borderRight: `4px solid ${selectedChild.theme}` }}
            >
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold" style={{ color: selectedChild.theme }}>
                {selectedChild.totalPoints}
              </div>
              <div className="text-sm text-gray-500">נקודות</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-[#ff6b6b]">
                {selectedChild.currentStreak}
              </div>
              <div className="text-sm text-gray-500">ימים ברצף</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-[#95e1d3]">
                {selectedChild.totalTasksCompleted}
              </div>
              <div className="text-sm text-gray-500">משימות הושלמו</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-3xl mb-2">{LEVELS[level].icon}</div>
              <div className="text-2xl font-bold text-[#a29bfe]">
                {LEVELS[level].name}
              </div>
              <div className="text-sm text-gray-500">רמה {level + 1}</div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{LEVELS[level].icon}</span>
                <span className="font-bold">{LEVELS[level].name}</span>
              </div>
              <div className="text-sm text-gray-500">
                {selectedChild.xp} / {nextLevelXP} XP
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${xpProgress}%`,
                  background: `linear-gradient(to left, ${selectedChild.theme}, ${selectedChild.theme}88)`,
                }}
              />
            </div>
            {level < LEVELS.length - 1 && (
              <div className="text-sm text-gray-500 mt-2 text-center">
                עוד {nextLevelXP - selectedChild.xp} XP לרמה הבאה:{" "}
                {LEVELS[level + 1].icon} {LEVELS[level + 1].name}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/dashboard/tasks"
              className="text-white rounded-2xl p-6 text-center hover:shadow-lg transition-all card-hover"
              style={{ backgroundColor: selectedChild.theme }}
            >
              <span className="material-symbols-outlined text-4xl mb-2">
                task_alt
              </span>
              <div className="font-bold">משימות היום</div>
            </a>

            <a
              href="/dashboard/shop"
              className="bg-[#ffd93d] text-gray-800 rounded-2xl p-6 text-center hover:shadow-lg transition-all card-hover"
            >
              <span className="material-symbols-outlined text-4xl mb-2">
                storefront
              </span>
              <div className="font-bold">חנות פרסים</div>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
