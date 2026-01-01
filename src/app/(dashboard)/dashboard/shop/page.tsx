"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ShopPage() {
  const children = useQuery(api.children.listByFamily);
  const rewards = useQuery(api.rewards.listByFamily);
  const [selectedChildId, setSelectedChildId] = useState<Id<"children"> | null>(
    null
  );
  const [showConfirm, setShowConfirm] = useState<Id<"rewards"> | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const purchase = useMutation(api.rewards.purchase);

  const selectedChild =
    selectedChildId && children
      ? children.find((c) => c._id === selectedChildId)
      : children?.[0];

  const unredeemedPurchases = useQuery(
    api.rewards.getUnredeemedPurchases,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  const handlePurchase = async (rewardId: Id<"rewards">) => {
    if (!selectedChild || purchasing) return;

    setPurchasing(true);
    try {
      await purchase({ childId: selectedChild._id, rewardId });
      setShowConfirm(null);
    } catch (error) {
      alert("לא הצלחנו לבצע את הרכישה. נסה שוב.");
    }
    setPurchasing(false);
  };

  if (!children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd93d]"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">החנות ריקה</h2>
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

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Child Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {children.map((child) => (
          <button
            key={child._id}
            onClick={() => setSelectedChildId(child._id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedChild?._id === child._id
                ? "bg-[#ffd93d] text-gray-800 shadow-lg"
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
          {/* Points Balance */}
          <div className="bg-gradient-to-r from-[#ffd93d] to-[#ffb347] rounded-2xl p-6 text-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">הנקודות שלך</div>
                <div className="text-4xl font-bold">{selectedChild.totalPoints}</div>
              </div>
              <div className="text-6xl">⭐</div>
            </div>
          </div>

          {/* Unredeemed Purchases */}
          {unredeemedPurchases && unredeemedPurchases.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                פרסים שטרם מומשו
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {unredeemedPurchases.map((purchase) => (
                  <div
                    key={purchase._id}
                    className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center"
                  >
                    <div className="text-3xl mb-2">{purchase.rewardIcon}</div>
                    <div className="font-medium text-sm">{purchase.rewardName}</div>
                    <div className="text-xs text-gray-500 mt-1">ממתין למימוש</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewards Shop */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              חנות הפרסים
            </h3>

            {rewards && rewards.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {rewards.map((reward) => {
                  const canAfford = selectedChild.totalPoints >= reward.cost;
                  return (
                    <button
                      key={reward._id}
                      onClick={() => canAfford && setShowConfirm(reward._id)}
                      disabled={!canAfford}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        canAfford
                          ? "border-[#ffd93d] hover:bg-yellow-50 hover:shadow-md cursor-pointer"
                          : "border-gray-200 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="text-4xl mb-2">{reward.icon}</div>
                      <div className="font-bold text-sm mb-1">{reward.name}</div>
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {reward.description}
                      </div>
                      <div
                        className={`font-bold ${canAfford ? "text-[#ffd93d]" : "text-gray-400"}`}
                      >
                        ⭐ {reward.cost}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🏪</div>
                <p>אין פרסים בחנות עדיין</p>
                <p className="text-sm mt-2">ההורים יכולים להוסיף פרסים במצב הורה</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Confirm Purchase Modal */}
      {showConfirm && rewards && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            {(() => {
              const reward = rewards.find((r) => r._id === showConfirm);
              if (!reward) return null;
              return (
                <>
                  <div className="text-6xl mb-4">{reward.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{reward.name}</h3>
                  <p className="text-gray-500 mb-4">{reward.description}</p>
                  <div className="text-2xl font-bold text-[#ffd93d] mb-6">
                    ⭐ {reward.cost} נקודות
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(null)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
                    >
                      ביטול
                    </button>
                    <button
                      onClick={() => handlePurchase(reward._id)}
                      disabled={purchasing}
                      className="flex-1 bg-[#ffd93d] text-gray-800 py-3 rounded-xl font-bold hover:bg-[#ffcc00] transition-colors disabled:opacity-50"
                    >
                      {purchasing ? "קונה..." : "קנה עכשיו! 🎉"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
