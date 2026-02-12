"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ManageRewardsPage() {
  const rewards = useQuery(api.rewards.listAllByFamily);
  const children = useQuery(api.children.listByFamily);
  const createReward = useMutation(api.rewards.create);
  const updateReward = useMutation(api.rewards.update);
  const deleteReward = useMutation(api.rewards.deleteReward);
  const redeemPurchase = useMutation(api.rewards.redeem);

  const parentRedeemMutation = useMutation(api.rewards.parentRedeem);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Id<"rewards"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"rewards"> | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<Id<"children"> | null>(null);

  // Parent redeem state
  const [redeemRewardId, setRedeemRewardId] = useState<Id<"rewards"> | null>(null);
  const [redeemChildIds, setRedeemChildIds] = useState<Id<"children">[]>([]);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResults, setRedeemResults] = useState<{ childName: string; success: boolean; error?: string }[] | null>(null);

  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("🎁");
  const [formDescription, setFormDescription] = useState("");
  const [formCost, setFormCost] = useState(50);

  const selectedChild = selectedChildId && children
    ? children.find((c) => c._id === selectedChildId)
    : children?.[0];

  const unredeemedPurchases = useQuery(
    api.rewards.getUnredeemedPurchases,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  const icons = [
    "🎁", "📺", "🍦", "🎮", "🌙", "🎢", "🍕", "🎬", "📱", "🎨",
    "⚽", "🏀", "🎹", "🎤", "🛍️", "🧸", "🎠", "🎡",
  ];

  const handleAddReward = async () => {
    if (!formName.trim()) return;

    await createReward({
      name: formName.trim(),
      icon: formIcon,
      description: formDescription.trim(),
      cost: formCost,
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleEditReward = async () => {
    if (!editingReward || !formName.trim()) return;

    await updateReward({
      rewardId: editingReward,
      name: formName.trim(),
      icon: formIcon,
      description: formDescription.trim(),
      cost: formCost,
    });

    resetForm();
    setEditingReward(null);
  };

  const handleDeleteReward = async (rewardId: Id<"rewards">) => {
    await deleteReward({ rewardId });
    setDeleteConfirm(null);
  };

  const handleRedeemPurchase = async (purchaseId: Id<"purchases">) => {
    await redeemPurchase({ purchaseId });
  };

  const openEditModal = (reward: NonNullable<typeof rewards>[0]) => {
    setFormName(reward.name);
    setFormIcon(reward.icon);
    setFormDescription(reward.description);
    setFormCost(reward.cost);
    setEditingReward(reward._id);
  };

  const resetForm = () => {
    setFormName("");
    setFormIcon("🎁");
    setFormDescription("");
    setFormCost(50);
  };

  const handleParentRedeem = async () => {
    if (!redeemRewardId || redeemChildIds.length === 0) return;
    setRedeemLoading(true);
    try {
      const results = await parentRedeemMutation({
        rewardId: redeemRewardId,
        childIds: redeemChildIds,
      });
      setRedeemResults(results);
    } catch (e) {
      setRedeemResults([{ childName: "?", success: false, error: String(e) }]);
    } finally {
      setRedeemLoading(false);
    }
  };

  const toggleRedeemChild = (childId: Id<"children">) => {
    setRedeemChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const openRedeemModal = (rewardId: Id<"rewards">) => {
    setRedeemRewardId(rewardId);
    setRedeemChildIds([]);
    setRedeemResults(null);
    setShowRedeemModal(true);
  };

  if (!rewards || !children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a29bfe]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול פרסים</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          הוסף פרס
        </button>
      </div>

      {/* Pending Redemptions */}
      {children.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            פרסים ממתינים למימוש
          </h2>

          {/* Child Selector */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4">
            {children.map((child) => (
              <button
                key={child._id}
                onClick={() => setSelectedChildId(child._id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedChild?._id === child._id
                    ? "bg-[#a29bfe] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="text-xl">{child.avatar}</span>
                <span className="font-medium">{child.name}</span>
              </button>
            ))}
          </div>

          {unredeemedPurchases && unredeemedPurchases.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {unredeemedPurchases.map((purchase) => (
                <div
                  key={purchase._id}
                  className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4"
                >
                  <div className="text-center mb-3">
                    <div className="text-3xl mb-2">{purchase.rewardIcon}</div>
                    <div className="font-bold">{purchase.rewardName}</div>
                    <div className="text-sm text-gray-500">
                      נרכש ב-{" "}
                      {new Date(purchase.purchasedAt).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeemPurchase(purchase._id)}
                    className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    סמן כמומש ✓
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>אין פרסים ממתינים למימוש</p>
            </div>
          )}
        </div>
      )}

      {/* Rewards List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          רשימת פרסים
        </h2>

        {rewards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rewards.map((reward) => (
              <div
                key={reward._id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  reward.isActive
                    ? "border-gray-200"
                    : "border-gray-200 opacity-50 bg-gray-50"
                }`}
              >
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{reward.icon}</div>
                  <div className="font-bold">{reward.name}</div>
                  <div className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {reward.description}
                  </div>
                  <div className="text-lg font-bold text-[#ffd93d]">
                    ⭐ {reward.cost}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {reward.isActive && (
                    <button
                      onClick={() => openRedeemModal(reward._id)}
                      className="w-full py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      🎁 ממש לילד
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(reward)}
                      className="flex-1 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(reward._id)}
                      className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-red-500 text-sm">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🎁</div>
            <p>אין פרסים עדיין</p>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              הוסף פרס ראשון
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingReward) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingReward ? "עריכת פרס" : "הוסף פרס חדש"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingReward(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">שם הפרס</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="לדוגמה: 30 דקות טלוויזיה"
                className="w-full rounded-xl border border-gray-200 p-3 focus:border-[#a29bfe] focus:outline-none"
              />
            </div>

            {/* Description Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">תיאור</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="תיאור קצר של הפרס..."
                rows={2}
                className="w-full rounded-xl border border-gray-200 p-3 focus:border-[#a29bfe] focus:outline-none resize-none"
              />
            </div>

            {/* Cost Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                מחיר (נקודות)
              </label>
              <input
                type="number"
                value={formCost}
                onChange={(e) => setFormCost(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full rounded-xl border border-gray-200 p-3 focus:border-[#a29bfe] focus:outline-none"
              />
            </div>

            {/* Icon Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">בחר אייקון</label>
              <div className="grid grid-cols-6 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormIcon(icon)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      formIcon === icon
                        ? "bg-[#a29bfe] scale-110"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingReward(null);
                  resetForm();
                }}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={editingReward ? handleEditReward : handleAddReward}
                disabled={!formName.trim()}
                className="flex-1 bg-[#a29bfe] text-white py-3 rounded-xl font-bold hover:bg-[#8b84e8] transition-colors disabled:opacity-50"
              >
                {editingReward ? "שמור שינויים" : "הוסף פרס"} 🎁
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">מחיקת פרס</h3>
            <p className="text-gray-500 mb-6">
              האם אתה בטוח שברצונך למחוק את הפרס?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={() => handleDeleteReward(deleteConfirm)}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Redeem Modal */}
      {showRedeemModal && redeemRewardId && (() => {
        const reward = rewards?.find((r) => r._id === redeemRewardId);
        if (!reward) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              {redeemResults ? (
                // Results view
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">
                      {redeemResults.every((r) => r.success) ? "✅" : "⚠️"}
                    </div>
                    <h2 className="text-xl font-bold">תוצאות מימוש</h2>
                  </div>
                  <div className="space-y-3 mb-6">
                    {redeemResults.map((result, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl flex items-center justify-between ${
                          result.success
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <span className="font-medium">{result.childName}</span>
                        <span className="text-sm">
                          {result.success ? (
                            <span className="text-green-600">✓ מומש בהצלחה</span>
                          ) : (
                            <span className="text-red-600">{result.error}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowRedeemModal(false);
                      setRedeemResults(null);
                    }}
                    className="w-full py-3 bg-[#a29bfe] text-white rounded-xl font-bold hover:bg-[#8b84e8] transition-colors"
                  >
                    סגור
                  </button>
                </>
              ) : (
                // Selection view
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">מימוש פרס לילד</h2>
                    <button
                      onClick={() => setShowRedeemModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  {/* Selected reward */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center mb-6">
                    <div className="text-4xl mb-2">{reward.icon}</div>
                    <div className="font-bold text-lg">{reward.name}</div>
                    <div className="text-sm text-gray-500">{reward.description}</div>
                    <div className="text-lg font-bold text-[#ffd93d] mt-2">
                      ⭐ {reward.cost} נקודות
                    </div>
                  </div>

                  {/* Child selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                      בחר ילדים למימוש:
                    </label>
                    <div className="space-y-2">
                      {children?.map((child) => (
                        <button
                          key={child._id}
                          onClick={() => toggleRedeemChild(child._id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                            redeemChildIds.includes(child._id)
                              ? "border-[#a29bfe] bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{child.avatar}</span>
                            <span className="font-medium">{child.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${
                              child.totalPoints >= reward.cost
                                ? "text-green-600"
                                : "text-red-500"
                            }`}>
                              ⭐ {child.totalPoints}
                            </span>
                            {redeemChildIds.includes(child._id) && (
                              <span className="text-[#a29bfe] text-xl">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRedeemModal(false)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
                    >
                      ביטול
                    </button>
                    <button
                      onClick={handleParentRedeem}
                      disabled={redeemChildIds.length === 0 || redeemLoading}
                      className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {redeemLoading ? (
                        <span className="animate-spin inline-block">⏳</span>
                      ) : (
                        `ממש ל-${redeemChildIds.length || "..."} ילדים 🎁`
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
