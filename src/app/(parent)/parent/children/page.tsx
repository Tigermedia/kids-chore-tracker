"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ManageChildrenPage() {
  const children = useQuery(api.children.listByFamily);
  const createChild = useMutation(api.children.createChild);
  const updateChild = useMutation(api.children.updateChild);
  const deleteChild = useMutation(api.children.deleteChild);
  const ensureUser = useMutation(api.users.ensureUser);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Id<"children"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"children"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formAvatar, setFormAvatar] = useState("😊");
  const [formTheme, setFormTheme] = useState("#22d1c6");

  const avatars = [
    // פרצופים
    "😊", "😎", "🤓", "😁", "🥳",
    // גיבורי על
    "🦸", "🦸‍♂️", "🦸‍♀️", "🦹", "🦹‍♂️", "🦹‍♀️", "🥷",
    // חיות
    "🦄", "🐴", "🐶", "🐱", "🦁", "🐻", "🐼", "🦊", "🐸", "🦋", "🐯", "🐰", "🐨",
    // אחר
    "🌟", "🚀", "⭐", "🎈", "🎨", "🎮", "👸", "🤴", "🧙", "🧚",
  ];

  const themes = [
    { color: "#22d1c6", name: "טורקיז" },
    { color: "#a29bfe", name: "סגול" },
    { color: "#ff6b6b", name: "אדום" },
    { color: "#ffd93d", name: "צהוב" },
    { color: "#95e1d3", name: "ירוק" },
    { color: "#74b9ff", name: "כחול" },
  ];

  const handleAddChild = async () => {
    if (!formName.trim() || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      console.log("=== Starting child creation process (Parent page) ===");

      // Step 1: Ensure user and family exist
      console.log("Step 1: Calling ensureUser...");
      const userId = await ensureUser();
      console.log("Step 2: ensureUser completed. User ID:", userId);

      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Create child
      console.log("Step 3: Creating child with name:", formName.trim());
      const childId = await createChild({
        name: formName.trim(),
        avatar: formAvatar,
        theme: formTheme,
      });
      console.log("Step 4: Child created successfully! Child ID:", childId);

      resetForm();
      setShowAddModal(false);
      console.log("=== Child creation completed successfully ===");
    } catch (err: unknown) {
      console.error("=== Error creating child ===");
      console.error("Error object:", err);

      // Extract detailed error message
      let message = "שגיאה לא ידועה";
      if (err instanceof Error) {
        message = err.message;
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      } else {
        message = String(err);
      }

      // Show user-friendly error in Hebrew
      if (message.includes("Not authenticated")) {
        setError("שגיאת אימות. אנא נסה להתנתק ולהתחבר מחדש.");
      } else if (message.includes("User not found")) {
        setError("המשתמש לא נמצא. אנא רענן את הדף ונסה שוב.");
      } else if (message.includes("Family not found")) {
        setError("משפחה לא נמצאה. אנא רענן את הדף ונסה שוב.");
      } else {
        setError(`שגיאה: ${message}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditChild = async () => {
    if (!editingChild || !formName.trim()) return;

    await updateChild({
      childId: editingChild,
      name: formName.trim(),
      avatar: formAvatar,
      theme: formTheme,
    });

    resetForm();
    setEditingChild(null);
  };

  const handleDeleteChild = async (childId: Id<"children">) => {
    await deleteChild({ childId });
    setDeleteConfirm(null);
  };

  const openEditModal = (child: NonNullable<typeof children>[0]) => {
    setFormName(child.name);
    setFormAvatar(child.avatar);
    setFormTheme(child.theme);
    setEditingChild(child._id);
  };

  const resetForm = () => {
    setFormName("");
    setFormAvatar("😊");
    setFormTheme("#22d1c6");
    setError(null);
  };

  if (!children) {
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
        <h1 className="text-2xl font-bold">ניהול ילדים</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          הוסף ילד
        </button>
      </div>

      {/* Children List */}
      {children.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child) => (
            <div
              key={child._id}
              className="bg-white rounded-2xl p-6 shadow-sm"
              style={{ borderRight: `4px solid ${child.theme}` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${child.theme}20` }}
                  >
                    {child.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{child.name}</h3>
                    <div className="text-sm text-gray-500">
                      נוצר ב-{" "}
                      {new Date(child.createdAt).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(child)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="ערוך"
                  >
                    <span className="material-symbols-outlined text-gray-500">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(child._id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="מחק"
                  >
                    <span className="material-symbols-outlined text-red-500">
                      delete
                    </span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold" style={{ color: child.theme }}>
                    {child.totalPoints}
                  </div>
                  <div className="text-xs text-gray-500">נקודות</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-[#95e1d3]">
                    {child.xp}
                  </div>
                  <div className="text-xs text-gray-500">XP</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-[#ff6b6b]">
                    {child.currentStreak}
                  </div>
                  <div className="text-xs text-gray-500">רצף</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-[#a29bfe]">
                    {child.totalTasksCompleted}
                  </div>
                  <div className="text-xs text-gray-500">משימות</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <div className="text-6xl mb-4">👶</div>
          <h2 className="text-xl font-bold mb-2">אין ילדים עדיין</h2>
          <p className="text-gray-500 mb-6">הוסף ילד ראשון כדי להתחיל</p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            הוסף ילד ראשון
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingChild) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingChild ? "עריכת ילד" : "הוסף ילד חדש"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingChild(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">שם הילד</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="הקלד את שם הילד..."
                className="w-full rounded-xl border border-gray-200 p-3 focus:border-[#a29bfe] focus:outline-none"
              />
            </div>

            {/* Avatar Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">בחר אווטאר</label>
              <div className="grid grid-cols-6 gap-2">
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setFormAvatar(avatar)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      formAvatar === avatar
                        ? "bg-[#a29bfe] scale-110"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">בחר צבע</label>
              <div className="grid grid-cols-6 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.color}
                    onClick={() => setFormTheme(theme.color)}
                    className={`w-10 h-10 rounded-xl transition-all ${
                      formTheme === theme.color
                        ? "ring-2 ring-offset-2 ring-[#a29bfe] scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: theme.color }}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingChild(null);
                  resetForm();
                }}
                disabled={isCreating}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                onClick={editingChild ? handleEditChild : handleAddChild}
                disabled={!formName.trim() || isCreating}
                className="flex-1 bg-[#a29bfe] text-white py-3 rounded-xl font-bold hover:bg-[#8b84e8] transition-colors disabled:opacity-50"
              >
                {isCreating ? "מוסיף..." : editingChild ? "שמור שינויים" : "הוסף ילד"} {!isCreating && "🎉"}
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
            <h3 className="text-xl font-bold mb-2">מחיקת ילד</h3>
            <p className="text-gray-500 mb-6">
              האם אתה בטוח שברצונך למחוק את הילד? כל הנתונים ימחקו לצמיתות.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={() => handleDeleteChild(deleteConfirm)}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
