"use client";

import { useTTS } from "../../hooks/useTTS";

interface SpeakerButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SpeakerButton({
  text,
  className = "",
  size = "md",
}: SpeakerButtonProps) {
  const { speak, stop, isSpeaking, isSupported } = useTTS();

  if (!isSupported) return null;

  const sizeClasses = {
    sm: "p-1.5 text-lg",
    md: "p-2 text-2xl",
    lg: "p-3 text-3xl",
  };

  return (
    <button
      onClick={() => (isSpeaking ? stop() : speak(text))}
      className={`rounded-full bg-blue-100 hover:bg-blue-200 transition-colors ${sizeClasses[size]} ${className}`}
      title={isSpeaking ? "עצור" : "השמע"}
      type="button"
    >
      {isSpeaking ? "⏹️" : "🔊"}
    </button>
  );
}
