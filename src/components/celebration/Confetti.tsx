"use client";

import { useEffect, useState, useCallback } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

const COLORS = ["#22d1c6", "#a29bfe", "#ffd93d", "#ff6b6b", "#95e1d3", "#ff9ff3"];
const EMOJIS = ["🎉", "⭐", "🌟", "✨", "💫", "🎊", "🏆", "👏"];

export function Confetti({ show, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [emoji, setEmoji] = useState("🎉");

  const generatePieces = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 1,
      });
    }
    return newPieces;
  }, []);

  useEffect(() => {
    if (show) {
      setPieces(generatePieces());
      setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [show, generatePieces, onComplete]);

  if (!show && pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Center emoji burst */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-8xl animate-bounce"
          style={{
            animation: "celebrationPop 0.5s ease-out",
          }}
        >
          {emoji}
        </div>
      </div>

      {/* Confetti pieces */}
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            backgroundColor: piece.color,
            animation: `confettiFall ${piece.duration}s ease-out ${piece.delay}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      {/* Success message */}
      <div
        className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2"
        style={{ animation: "slideUp 0.5s ease-out 0.2s both" }}
      >
        <div className="bg-white/90 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-xl">
          <p className="text-2xl font-bold text-[#22d1c6] text-center">
            כל הכבוד! 🎉
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes celebrationPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          0% {
            transform: translate(-50%, 50px);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
