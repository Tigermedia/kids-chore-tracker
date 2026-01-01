"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

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
  const children = useQuery(api.children.listByFamily);
  const [selectedChildId, setSelectedChildId] = useState<Id<"children"> | null>(
    null
  );
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("😊");

  const createChild = useMutation(api.children.createChild);

  const avatars = [
    "😊", "😎", "🤓", "🦄", "🐶", "🐱", "🦁", "🐻", "🐼", "🦊",
    "🐸", "🦋", "🌟", "🚀", "⭐", "🎈", "🎨", "🎮",
  ];

  const themes = [
    { color: "#22d1c6", name: "טורקיז" },
    { color: "#a29bfe", name: "סגול" },
    { color: "#ff6b6b", name: "אדום" },
    { color: "#ffd93d", name: "צהוב" },
    { color: "#95e1d3", name: "ירוק" },
    { color: "#dfe6e9", name: "אפור" },
  ];

  const selectedChild =
    selectedChildId && children
      ? children.find((c) => c._id === selectedChildId)
      : children?.[0];

  const handleAddChild = async () => {
    if (!newChildName.trim()) return;

    await createChild({
      name: newChildName.trim(),
      avatar: selectedAvatar,
      theme: "#22d1c6",
    });

    setNewChildName("");
    setSelectedAvatar("😊");
    setShowAddChild(false);
  };

  if (!children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22d1c6]"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-6">👶</div>
        <h2 className="text-2xl font-bold mb-4">ברוכים הבאים!</h2>
        <p className="text-gray-600 mb-8">
          בואו נוסיף את הילד הראשון למשפחה
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-6 text-right">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">שם הילד</label>
            <input
              type="text"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="הקלד את שם הילד..."
              className="w-full rounded-xl border border-gray-200 p-3 focus:border-[#22d1c6] focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">בחר אווטאר</label>
            <div className="grid grid-cols-6 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    selectedAvatar === avatar
                      ? "bg-[#22d1c6] scale-110"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddChild}
            disabled={!newChildName.trim()}
            className="w-full bg-[#22d1c6] text-white py-3 rounded-xl font-bold hover:bg-[#1db8ae] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            הוסף ילד 🎉
          </button>
        </div>
      </div>
    );
  }

  const level = selectedChild ? calculateLevel(selectedChild.xp) : 0;
  const currentLevelXP = LEVELS[level].xpRequired;
  const nextLevelXP = getNextLevelXP(selectedChild?.xp || 0);
  const xpProgress =
    selectedChild && nextLevelXP > currentLevelXP
      ? ((selectedChild.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
      : 100;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Child Selector */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {children.map((child) => (
          <button
            key={child._id}
            onClick={() => setSelectedChildId(child._id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedChild?._id === child._id
                ? "bg-[#22d1c6] text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">{child.avatar}</span>
            <span className="font-medium">{child.name}</span>
          </button>
        ))}

        <button
          onClick={() => setShowAddChild(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-outlined">add</span>
          הוסף ילד
        </button>
      </div>

      {selectedChild && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-[#22d1c6]">
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
                className="h-full bg-gradient-to-r from-[#22d1c6] to-[#a29bfe] transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
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
              className="bg-[#22d1c6] text-white rounded-2xl p-6 text-center hover:shadow-lg transition-all card-hover"
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

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">הוסף ילד חדש</h2>
              <button
                onClick={() => setShowAddChild(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">שם הילד</label>
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="הקלד את שם הילד..."
                className="w-full rounded-xl border border-gray-200 p-3 focus:border-[#22d1c6] focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">בחר אווטאר</label>
              <div className="grid grid-cols-6 gap-2">
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      selectedAvatar === avatar
                        ? "bg-[#22d1c6] scale-110"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddChild(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={handleAddChild}
                disabled={!newChildName.trim()}
                className="flex-1 bg-[#22d1c6] text-white py-3 rounded-xl font-bold hover:bg-[#1db8ae] transition-colors disabled:opacity-50"
              >
                הוסף 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
