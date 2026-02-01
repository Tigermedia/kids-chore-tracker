"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useChild } from "../../../../contexts/ChildContext";

export default function ReportsPage() {
  const { selectedChild, children, isLoading } = useChild();

  const completionHistory = useQuery(
    api.tasks.getCompletionHistory,
    selectedChild ? { childId: selectedChild._id, limit: 30 } : "skip"
  );

  if (isLoading || !children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22d1c6]"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">אין דוחות עדיין</h2>
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

  // Group completions by date
  const completionsByDate: Record<
    string,
    NonNullable<typeof completionHistory>
  > = {};
  completionHistory?.forEach((completion) => {
    if (!completionsByDate[completion.date]) {
      completionsByDate[completion.date] = [];
    }
    completionsByDate[completion.date].push(completion);
  });

  const sortedDates = Object.keys(completionsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-[#22d1c6]">
            {selectedChild.totalPoints}
          </div>
          <div className="text-sm text-gray-500">נקודות סה״כ</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-[#95e1d3]">
            {selectedChild.totalTasksCompleted}
          </div>
          <div className="text-sm text-gray-500">משימות הושלמו</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-[#ff6b6b]">
            {selectedChild.currentStreak}
          </div>
          <div className="text-sm text-gray-500">ימים ברצף</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-[#a29bfe]">
            {selectedChild.longestStreak}
          </div>
          <div className="text-sm text-gray-500">רצף שיא</div>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">📅</span>
          היסטוריית פעילות
        </h3>

        {sortedDates.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const dayCompletions = completionsByDate[date];
              const totalPoints = dayCompletions.reduce(
                (sum, c) => sum + c.points,
                0
              );
              const formattedDate = new Date(date).toLocaleDateString(
                "he-IL",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }
              );

              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-gray-700">
                      {formattedDate}
                    </div>
                    <div className="text-sm text-[#22d1c6]">
                      +{totalPoints} נקודות
                    </div>
                  </div>
                  <div className="space-y-2">
                    {dayCompletions.map((completion) => (
                      <div
                        key={completion._id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="text-2xl">{completion.taskIcon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {completion.taskName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(completion.completedAt).toLocaleTimeString(
                              "he-IL",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-[#22d1c6]">
                          +{completion.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p>אין פעילות עדיין</p>
            <p className="text-sm mt-2">השלם משימות כדי לראות את ההיסטוריה</p>
          </div>
        )}
      </div>
    </div>
  );
}
