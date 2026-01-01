"use client";

import { useRef, useState, useEffect } from "react";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function PinInput({ value, onChange, disabled, error }: PinInputProps) {
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);

  // Sync external value with internal state
  useEffect(() => {
    const newDigits = value.split("").slice(0, 4);
    while (newDigits.length < 4) newDigits.push("");
    setDigits(newDigits);
  }, [value]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!disabled) {
      inputRefs[0].current?.focus();
    }
  }, [disabled]);

  const handleChange = (index: number, newValue: string) => {
    // Only allow single digit
    const digit = newValue.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    onChange(newDigits.join(""));

    // Move to next input if digit entered
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Move to previous input on backspace if empty
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    // Move to next input on right arrow
    if (e.key === "ArrowRight" && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    // Move to previous input on left arrow
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const newDigits = pasted.split("");
    while (newDigits.length < 4) newDigits.push("");
    setDigits(newDigits);
    onChange(newDigits.join(""));

    // Focus last filled input or last input
    const lastFilledIndex = Math.min(pasted.length, 3);
    inputRefs[lastFilledIndex].current?.focus();
  };

  return (
    <div className="flex gap-3 justify-center" dir="ltr">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={inputRefs[index]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none ${
            error
              ? "border-red-500 bg-red-50 shake"
              : digit
              ? "border-[#a29bfe] bg-[#a29bfe]/10"
              : "border-gray-200 focus:border-[#a29bfe]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      ))}
    </div>
  );
}
