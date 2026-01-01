"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PinInput } from "./PinInput";

interface PinModalProps {
  mode: "setup" | "verify";
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PinModal({ mode, onSuccess, onCancel }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setParentPin = useMutation(api.families.setParentPin);
  const verifyParentPin = useMutation(api.families.verifyParentPin);

  // Clear error after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePinChange = (value: string) => {
    setError(null);
    if (step === "confirm") {
      setConfirmPin(value);
    } else {
      setPin(value);
    }
  };

  const handleSubmit = async () => {
    if (mode === "setup") {
      if (step === "enter") {
        if (pin.length !== 4) {
          setError("הזן 4 ספרות");
          return;
        }
        setStep("confirm");
        setConfirmPin("");
      } else {
        if (confirmPin !== pin) {
          setError("הקודים לא תואמים");
          setConfirmPin("");
          return;
        }
        setIsLoading(true);
        try {
          await setParentPin({ pin });
          onSuccess();
        } catch {
          setError("שגיאה בשמירת הקוד");
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // Verify mode
      if (pin.length !== 4) {
        setError("הזן 4 ספרות");
        return;
      }
      setIsLoading(true);
      try {
        const isValid = await verifyParentPin({ pin });
        if (isValid) {
          onSuccess();
        } else {
          setError("קוד שגוי");
          setPin("");
        }
      } catch {
        setError("שגיאה באימות הקוד");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Auto-submit when 4 digits entered in verify mode
  useEffect(() => {
    if (mode === "verify" && pin.length === 4) {
      handleSubmit();
    }
  }, [pin, mode]);

  // Auto-submit when confirm PIN is 4 digits in setup mode
  useEffect(() => {
    if (mode === "setup" && step === "confirm" && confirmPin.length === 4) {
      handleSubmit();
    }
  }, [confirmPin, mode, step]);

  const currentPin = step === "confirm" ? confirmPin : pin;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
        {/* Icon */}
        <div className="text-5xl mb-4">
          {mode === "setup" ? "🔐" : "🔒"}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-2">
          {mode === "setup"
            ? step === "enter"
              ? "הגדר קוד הורה"
              : "אשר את הקוד"
            : "הזן קוד הורה"}
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 mb-6 text-sm">
          {mode === "setup"
            ? step === "enter"
              ? "בחר קוד בן 4 ספרות להגנה על מצב ההורה"
              : "הזן שוב את הקוד לאישור"
            : "הזן את הקוד כדי לגשת למצב ההורה"}
        </p>

        {/* PIN Input */}
        <div className="mb-6">
          <PinInput
            value={currentPin}
            onChange={handlePinChange}
            disabled={isLoading}
            error={!!error}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              ביטול
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isLoading || currentPin.length !== 4}
            className="flex-1 bg-[#a29bfe] text-white py-3 rounded-xl font-bold hover:bg-[#8b84e8] transition-colors disabled:opacity-50"
          >
            {isLoading
              ? "טוען..."
              : mode === "setup"
              ? step === "enter"
                ? "המשך"
                : "שמור"
              : "כניסה"}
          </button>
        </div>

        {/* Back button in confirm step */}
        {mode === "setup" && step === "confirm" && (
          <button
            onClick={() => {
              setStep("enter");
              setConfirmPin("");
            }}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            חזור לשלב הקודם
          </button>
        )}
      </div>
    </div>
  );
}
