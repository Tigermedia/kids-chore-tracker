"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ReducePointsPage() {
  const children = useQuery(api.children.listByFamily);
  const reducePoints = useMutation(api.pointReductions.create);
  const generateUploadUrl = useMutation(api.pointReductions.generateUploadUrl);

  const [selectedChildId, setSelectedChildId] = useState<Id<"children"> | "">("");
  const [points, setPoints] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChild = children?.find((c) => c._id === selectedChildId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId || points <= 0 || !reason.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let imageStorageId: Id<"_storage"> | undefined = undefined;

      // Upload image if provided
      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        const result = await response.json();
        imageStorageId = result.storageId;
      }

      // Create point reduction
      await reducePoints({
        childId: selectedChildId as Id<"children">,
        points,
        reason: reason.trim(),
        imageStorageId,
      });

      // Reset form
      setSelectedChildId("");
      setPoints(0);
      setReason("");
      setImageFile(null);
      setImagePreview(null);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error reducing points:", error);
      alert("שגיאה בהורדת הנקודות. אנא נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a29bfe]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">הורדת נקודות ➖</h1>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-bounce-in">
          <span className="material-symbols-outlined">check_circle</span>
          הנקודות הורדו בהצלחה! הילד יקבל התראה.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Child Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              בחר ילד <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value as Id<"children">)}
              className="w-full rounded-xl border border-gray-200 p-4 focus:border-[#a29bfe] focus:outline-none text-lg"
              required
            >
              <option value="">בחר ילד...</option>
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.avatar} {child.name} ({child.totalPoints} נקודות)
                </option>
              ))}
            </select>
          </div>

          {/* Selected Child Info */}
          {selectedChild && (
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
              <span className="text-4xl">{selectedChild.avatar}</span>
              <div>
                <div className="font-bold text-lg">{selectedChild.name}</div>
                <div className="text-gray-500">
                  יתרה נוכחית:{" "}
                  <span className="font-bold text-[#22d1c6]">
                    {selectedChild.totalPoints}
                  </span>{" "}
                  נקודות
                </div>
              </div>
            </div>
          )}

          {/* Points Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              מספר נקודות להורדה <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={selectedChild?.totalPoints || 1000}
              value={points || ""}
              onChange={(e) => setPoints(Number(e.target.value))}
              placeholder="הקלד מספר..."
              className="w-full rounded-xl border border-gray-200 p-4 focus:border-[#a29bfe] focus:outline-none text-lg"
              required
            />
            {selectedChild && points > selectedChild.totalPoints && (
              <p className="text-red-500 text-sm mt-1">
                לא ניתן להוריד יותר מהיתרה הנוכחית ({selectedChild.totalPoints})
              </p>
            )}
          </div>

          {/* Reason (Required) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              סיבה להורדה <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="הסבר לילד למה מורידים נקודות..."
              className="w-full rounded-xl border border-gray-200 p-4 focus:border-[#a29bfe] focus:outline-none min-h-[120px] text-lg"
              required
            />
            <p className="text-gray-500 text-sm mt-1">
              הילד יראה את ההסבר הזה בהתראה שלו
            </p>
          </div>

          {/* Image Upload (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              תמונה (אופציונלי)
            </label>
            <p className="text-gray-500 text-sm mb-3">
              ניתן לצרף תמונה להמחשה (למשל: תמונה של חדר לא מסודר)
            </p>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#a29bfe] transition-colors"
              >
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">
                  add_photo_alternate
                </span>
                <div className="text-gray-500">לחץ להוספת תמונה</div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Summary */}
          {selectedChild && points > 0 && reason.trim() && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-bold text-red-700 mb-2">סיכום:</h3>
              <p className="text-red-600">
                עומדים להוריד <span className="font-bold">{points}</span> נקודות
                מ-<span className="font-bold">{selectedChild.name}</span>
              </p>
              <p className="text-red-600 mt-1">
                יתרה חדשה:{" "}
                <span className="font-bold">
                  {Math.max(0, selectedChild.totalPoints - points)}
                </span>{" "}
                נקודות
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedChildId ||
              points <= 0 ||
              !reason.trim() ||
              (selectedChild && points > selectedChild.totalPoints)
            }
            className="w-full bg-[#ff6b6b] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#ff5252] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                מעבד...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">remove_circle</span>
                הורד נקודות ושלח התראה
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-500">info</span>
          <div className="text-blue-700 text-sm">
            <p className="font-bold mb-1">מה קורה אחרי הורדת נקודות?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>הנקודות יורדות מיד מחשבון הילד</li>
              <li>הילד יקבל התראה עם ההסבר שכתבת</li>
              <li>אם צירפת תמונה, היא תופיע בהתראה</li>
              <li>הילד יצטרך לאשר שקרא את ההתראה</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
