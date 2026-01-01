"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { PinInput } from "../../../../components/pin/PinInput";

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const family = useQuery(api.users.getUserFamily);
  const hasPin = useQuery(api.families.hasParentPin);

  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  const verifyParentPin = useMutation(api.families.verifyParentPin);
  const setParentPin = useMutation(api.families.setParentPin);

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setPinSuccess(false);

    if (newPin.length !== 4) {
      setPinError("קוד PIN חייב להכיל 4 ספרות");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("הקודים אינם תואמים");
      return;
    }

    // If PIN exists, verify current PIN first
    if (hasPin) {
      const isValid = await verifyParentPin({ pin: currentPin });
      if (!isValid) {
        setPinError("קוד PIN הנוכחי שגוי");
        return;
      }
    }

    // Set new PIN
    await setParentPin({ pin: newPin });
    setPinSuccess(true);
    setShowPinChange(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");

    // Clear success message after 3 seconds
    setTimeout(() => setPinSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    if (confirm("האם אתה בטוח שברצונך להתנתק?")) {
      // Clear parent mode session
      localStorage.removeItem("parentModeLastActivity");
      await signOut();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#a29bfe]">הגדרות</h1>

      {/* Account Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#a29bfe]">person</span>
          פרטי חשבון
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-500">שם</span>
            <span className="font-medium">{user?.fullName || user?.firstName || "משתמש"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-500">אימייל</span>
            <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-500">משפחה</span>
            <span className="font-medium">{family?.name || "טוען..."}</span>
          </div>
        </div>
      </div>

      {/* PIN Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#a29bfe]">lock</span>
          קוד PIN להורים
        </h2>

        {pinSuccess && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl mb-4">
            קוד ה-PIN עודכן בהצלחה!
          </div>
        )}

        {!showPinChange ? (
          <div className="flex items-center justify-between">
            <p className="text-gray-500">
              {hasPin ? "קוד PIN מוגדר" : "לא הוגדר קוד PIN"}
            </p>
            <button
              onClick={() => setShowPinChange(true)}
              className="px-4 py-2 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors"
            >
              {hasPin ? "שנה קוד" : "הגדר קוד"}
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinChange} className="space-y-4">
            {hasPin && (
              <div>
                <label className="block text-sm font-medium mb-2">קוד נוכחי</label>
                <PinInput
                  value={currentPin}
                  onChange={setCurrentPin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">קוד חדש</label>
              <PinInput
                value={newPin}
                onChange={setNewPin}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">אשר קוד חדש</label>
              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                error={pinError.includes("תואמים")}
              />
            </div>

            {pinError && (
              <p className="text-red-500 text-sm text-center">{pinError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPinChange(false);
                  setCurrentPin("");
                  setNewPin("");
                  setConfirmPin("");
                  setPinError("");
                }}
                className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors font-medium"
              >
                שמור
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#a29bfe]">logout</span>
          התנתקות
        </h2>
        <p className="text-gray-500 mb-4">התנתק מהחשבון הנוכחי</p>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-3 border-2 border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition-colors font-medium"
        >
          התנתק
        </button>
      </div>
    </div>
  );
}
