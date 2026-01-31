"use client";

import { useEffect } from "react";

export default function ParentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Parent section error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">שגיאה בטעינת הדף</h2>
        <p className="text-gray-500 mb-6 text-sm">
          {error.message || "אירעה שגיאה. נסה שוב."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-6 py-3 border rounded-xl hover:bg-gray-50 transition-colors"
          >
            חזרה לדשבורד
          </button>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors font-medium"
          >
            נסה שוב
          </button>
        </div>
      </div>
    </div>
  );
}
