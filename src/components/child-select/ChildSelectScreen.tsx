"use client";

import { useChild } from "../../contexts/ChildContext";

export function ChildSelectScreen() {
  const { children, selectChild, isLoading } = useChild();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#a29bfe]/20 via-[#22d1c6]/10 to-[#ffd93d]/20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#22d1c6]"></div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#a29bfe]/20 via-[#22d1c6]/10 to-[#ffd93d]/20 p-6">
      {/* Title */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          מי אתה/את?
        </h1>
        <p className="text-lg text-gray-500">
          בחר/י את הפרופיל שלך כדי להתחיל
        </p>
      </div>

      {/* Child Cards */}
      <div className="flex flex-wrap justify-center gap-6 max-w-lg w-full">
        {children.map((child, index) => (
          <button
            key={child._id}
            onClick={() => selectChild(child._id)}
            className="group flex flex-col items-center gap-3 p-6 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 min-w-[140px] border-4 border-transparent hover:border-current"
            style={{
              animationDelay: `${index * 100}ms`,
              color: child.theme,
            }}
          >
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${child.theme}20` }}
            >
              {child.avatar}
            </div>

            {/* Name */}
            <span
              className="text-xl font-bold"
              style={{ color: child.theme }}
            >
              {child.name}
            </span>

            {/* Points badge */}
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              ⭐ {child.totalPoints} נקודות
            </span>
          </button>
        ))}
      </div>

      {/* Fun footer */}
      <div className="mt-12 text-center text-gray-400 text-sm">
        <p>✨ יום מלא בכוכבים מחכה לך! ✨</p>
      </div>
    </div>
  );
}
