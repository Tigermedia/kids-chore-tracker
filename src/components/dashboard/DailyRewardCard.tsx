"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Confetti } from "../celebration/Confetti";

interface DailyRewardCardProps {
  childId: Id<"children">;
  theme: string;
}

type RewardState = "unclaimed" | "spinning" | "revealed" | "claimed";

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculate() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export function DailyRewardCard({ childId, theme }: DailyRewardCardProps) {
  const [state, setState] = useState<RewardState>("unclaimed");
  const [spinNumber, setSpinNumber] = useState(0);
  const [finalReward, setFinalReward] = useState<{
    points: number;
    isJackpot: boolean;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dailyReward = useQuery(api.dailyRewards.getDailyReward, { childId });
  const claimReward = useMutation(api.dailyRewards.claimDailyReward);
  const countdown = useCountdown();

  // Sync state with server data
  useEffect(() => {
    if (dailyReward?.claimedToday && state === "unclaimed") {
      setState("claimed");
      setFinalReward({
        points: dailyReward.pointsAwarded ?? 0,
        isJackpot: dailyReward.isJackpot,
      });
    }
  }, [dailyReward, state]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  const handleClaim = useCallback(async () => {
    if (state !== "unclaimed" || !dailyReward || dailyReward.claimedToday) return;

    // Start spinning animation
    setState("spinning");
    let counter = 0;

    spinIntervalRef.current = setInterval(() => {
      setSpinNumber(Math.floor(Math.random() * 25) + 1);
      counter++;
    }, 80);

    try {
      // Claim the reward from the server
      const result = await claimReward({ childId });

      // Continue spinning for a moment, then reveal
      setTimeout(() => {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current);
          spinIntervalRef.current = null;
        }

        // Slow down effect
        let slowCount = 0;
        const slowInterval = setInterval(() => {
          setSpinNumber(
            Math.floor(Math.random() * (result.isJackpot ? 25 : 10)) + 1
          );
          slowCount++;
          if (slowCount >= 5) {
            clearInterval(slowInterval);
            // Reveal final number
            setSpinNumber(result.pointsAwarded);
            setFinalReward({
              points: result.pointsAwarded,
              isJackpot: result.isJackpot,
            });
            setState("revealed");
            setShowConfetti(true);
          }
        }, 200);
      }, 1200);
    } catch (e) {
      console.error("Failed to claim daily reward:", e);
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
      setState("unclaimed");
    }
  }, [state, dailyReward, claimReward, childId]);

  if (dailyReward === undefined) return null;

  const streak = dailyReward?.streak ?? 0;

  // Already claimed state
  if (state === "claimed" || (dailyReward?.claimedToday && state === "unclaimed")) {
    return (
      <div className="bg-gray-50 rounded-2xl p-5 shadow-sm border-2 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl opacity-40">🎁</div>
            <div>
              <div className="font-bold text-gray-400">פרס יומי</div>
              <div className="text-sm text-gray-400">
                קיבלת {finalReward?.points ?? dailyReward?.pointsAwarded ?? 0}{" "}
                נקודות היום
                {(finalReward?.isJackpot || dailyReward?.isJackpot) && " 🎰"}
              </div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-400">פרס חדש בעוד</div>
            <div className="text-sm font-mono font-bold text-gray-500">
              {String(countdown.hours).padStart(2, "0")}:
              {String(countdown.minutes).padStart(2, "0")}:
              {String(countdown.seconds).padStart(2, "0")}
            </div>
          </div>
        </div>
        {streak > 1 && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            🔥 רצף: {streak} ימים
          </div>
        )}
      </div>
    );
  }

  // Spinning / Reveal states
  if (state === "spinning" || state === "revealed") {
    return (
      <>
        <Confetti
          show={showConfetti}
          onComplete={() => {
            setShowConfetti(false);
            // Transition to claimed after confetti
            setTimeout(() => setState("claimed"), 500);
          }}
        />

        <div
          className="rounded-2xl p-6 shadow-lg overflow-hidden relative"
          style={{
            background:
              state === "revealed" && finalReward?.isJackpot
                ? "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)"
                : `linear-gradient(135deg, ${theme}, ${theme}dd)`,
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-3">
              {state === "spinning" ? "🎰" : finalReward?.isJackpot ? "🏆" : "🎉"}
            </div>

            <div
              className={`text-6xl font-black text-white mb-2 ${
                state === "spinning" ? "spin-number" : "reveal-number"
              }`}
            >
              {spinNumber}
            </div>

            <div className="text-white/90 text-lg font-bold">
              {state === "spinning"
                ? "...מגלים את הפרס"
                : finalReward?.isJackpot
                  ? "🎰 ג׳קפוט! 🎰"
                  : "!נקודות נוספו"}
            </div>

            {state === "revealed" && (
              <div className="text-white/80 text-sm mt-2">
                +{finalReward?.points} נקודות הוספו לחשבונך
              </div>
            )}
          </div>

          <style jsx>{`
            .spin-number {
              animation: spinPulse 0.15s infinite alternate;
            }

            .reveal-number {
              animation: revealPop 0.5s ease-out;
            }

            @keyframes spinPulse {
              0% {
                transform: scale(0.95);
                opacity: 0.8;
              }
              100% {
                transform: scale(1.05);
                opacity: 1;
              }
            }

            @keyframes revealPop {
              0% {
                transform: scale(0.5);
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
          `}</style>
        </div>
      </>
    );
  }

  // Unclaimed state - bouncing gift
  return (
    <button
      onClick={handleClaim}
      className="w-full rounded-2xl p-5 shadow-sm overflow-hidden relative transition-all hover:shadow-lg active:scale-[0.98] border-2"
      style={{
        background: `linear-gradient(135deg, ${theme}15, ${theme}30)`,
        borderColor: `${theme}60`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="gift-bounce text-4xl">🎁</div>
          <div className="text-right">
            <div className="font-bold text-gray-800">פרס יומי!</div>
            <div className="text-sm text-gray-500">
              לחץ לגלות מה מחכה לך היום
            </div>
          </div>
        </div>
        <div
          className="gift-glow px-4 py-2 rounded-full text-white font-bold text-sm"
          style={{ backgroundColor: theme }}
        >
          פתח! ✨
        </div>
      </div>

      {streak > 0 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          🔥 רצף: {streak} ימים
        </div>
      )}

      <style jsx>{`
        .gift-bounce {
          animation: giftBounce 1.5s ease-in-out infinite;
        }

        .gift-glow {
          animation: giftGlow 2s ease-in-out infinite;
        }

        @keyframes giftBounce {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(-5deg);
          }
          75% {
            transform: translateY(-4px) rotate(5deg);
          }
        }

        @keyframes giftGlow {
          0%,
          100% {
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.6),
              0 0 40px rgba(255, 255, 255, 0.2);
          }
        }
      `}</style>
    </button>
  );
}
