"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ParentReportsPage() {
  const children = useQuery(api.children.listByFamily);
  const [selectedChildId, setSelectedChildId] = useState<Id<"children"> | null>(
    null
  );

  const selectedChild =
    selectedChildId && children
      ? children.find((c) => c._id === selectedChildId)
      : children?.[0];

  const completionHistory = useQuery(
    api.tasks.getCompletionHistory,
    selectedChild ? { childId: selectedChild._id, limit: 50 } : "skip"
  );

  const pointReductions = useQuery(
    api.pointReductions.getByChild,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  const purchaseHistory = useQuery(
    api.rewards.getPurchases,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  const achievementCount = useQuery(
    api.achievements.getCount,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  if (!children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a29bfe]"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-bold mb-2">אין דוחות עדיין</h2>
        <p className="text-gray-500">הוסף ילד ראשון כדי לראות דוחות</p>
      </div>
    );
  }

  // Calculate stats
  const totalPointsEarned =
    completionHistory?.reduce((sum, c) => sum + c.points, 0) ?? 0;
  const totalPointsDeducted =
    pointReductions?.reduce((sum, r) => sum + r.points, 0) ?? 0;
  const totalPointsSpent =
    purchaseHistory?.reduce((sum, p) => sum + p.cost, 0) ?? 0;

  // Group completions by date for chart
  const completionsByDate: Record<string, number> = {};
  completionHistory?.forEach((c) => {
    completionsByDate[c.date] = (completionsByDate[c.date] || 0) + 1;
  });

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">דוחות</h1>

      {/* Child Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {children.map((child) => (
          <button
            key={child._id}
            onClick={() => setSelectedChildId(child._id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedChild?._id === child._id
                ? "bg-[#a29bfe] text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">{child.avatar}</span>
            <span className="font-medium">{child.name}</span>
          </button>
        ))}
      </div>

      {selectedChild && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-[#22d1c6]">
                {selectedChild.totalPoints}
              </div>
              <div className="text-sm text-gray-500">נקודות נוכחי</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-bold text-green-500">
                +{totalPointsEarned}
              </div>
              <div className="text-sm text-gray-500">נקודות שנצברו</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-3xl mb-2">📉</div>
              <div className="text-2xl font-bold text-red-500">
                -{totalPointsDeducted}
              </div>
              <div className="text-sm text-gray-500">נקודות שהורדו</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-3xl mb-2">🛒</div>
              <div className="text-2xl font-bold text-[#ffd93d]">
                {totalPointsSpent}
              </div>
              <div className="text-sm text-gray-500">נקודות שנוצלו</div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">סטטיסטיקות כלליות</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">משימות שהושלמו</span>
                  <span className="font-bold text-[#22d1c6]">
                    {selectedChild.totalTasksCompleted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">רצף נוכחי</span>
                  <span className="font-bold text-[#ff6b6b]">
                    {selectedChild.currentStreak} ימים
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">רצף שיא</span>
                  <span className="font-bold text-[#a29bfe]">
                    {selectedChild.longestStreak} ימים
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">XP</span>
                  <span className="font-bold text-[#95e1d3]">
                    {selectedChild.xp}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">הישגים שנפתחו</span>
                  <span className="font-bold text-[#ffd93d]">
                    {achievementCount?.unlocked ?? 0}/{achievementCount?.total ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">פעילות שבועית</h3>
              <div className="flex items-end justify-between h-32 gap-2">
                {last7Days.map((date) => {
                  const count = completionsByDate[date] || 0;
                  const maxCount = Math.max(
                    ...Object.values(completionsByDate),
                    1
                  );
                  const height = count > 0 ? (count / maxCount) * 100 : 5;

                  return (
                    <div
                      key={date}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-[#22d1c6] rounded-t-lg transition-all"
                        style={{ height: `${height}%` }}
                        title={`${count} משימות`}
                      />
                      <span className="text-xs text-gray-400">
                        {new Date(date).toLocaleDateString("he-IL", {
                          weekday: "narrow",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Point Reductions History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              היסטוריית הורדות נקודות
            </h3>

            {pointReductions && pointReductions.length > 0 ? (
              <div className="space-y-3">
                {pointReductions.map((reduction) => (
                  <div
                    key={reduction._id}
                    className="flex items-center gap-4 p-4 bg-red-50 rounded-xl"
                  >
                    <div className="text-2xl">➖</div>
                    <div className="flex-1">
                      <div className="font-medium">{reduction.reason}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(reduction.createdAt).toLocaleDateString(
                          "he-IL",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-red-500">
                      -{reduction.points}
                    </div>
                    {reduction.isAcknowledged && (
                      <span className="text-green-500 text-sm">✓ נצפה</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>אין הורדות נקודות</p>
              </div>
            )}
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              היסטוריית רכישות
            </h3>

            {purchaseHistory && purchaseHistory.length > 0 ? (
              <div className="space-y-3">
                {purchaseHistory.map((purchase) => (
                  <div
                    key={purchase._id}
                    className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl"
                  >
                    <div className="text-2xl">{purchase.rewardIcon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{purchase.rewardName}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(purchase.purchasedAt).toLocaleDateString(
                          "he-IL",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[#ffd93d]">
                      ⭐ {purchase.cost}
                    </div>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        purchase.isRedeemed
                          ? "bg-green-100 text-green-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {purchase.isRedeemed ? "מומש" : "ממתין"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>אין רכישות עדיין</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
