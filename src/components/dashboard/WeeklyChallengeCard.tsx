"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Confetti } from "../celebration/Confetti";

interface WeeklyChallengeCardProps {
  childId: Id<"children">;
  theme: string;
}

export function WeeklyChallengeCard({
  childId,
  theme,
}: WeeklyChallengeCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const challenge = useQuery(api.challenges.getActiveChallenge, { childId });
  const progress = useQuery(
    api.challenges.getChallengeProgress,
    challenge ? { childId, challengeId: challenge._id } : "skip"
  );
  const claimReward = useMutation(api.challenges.claimChallengeReward);

  // No challenge loaded yet
  if (challenge === undefined) return null;
  // No challenge for this week (shouldn't happen after initialization)
  if (challenge === null) return null;

  const isReadyToClaim = progress?.isCompleted && !challenge.isCompleted;
  const isClaimed = challenge.isCompleted;

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      await claimReward({ childId, challengeId: challenge._id });
      setShowCelebration(true);
    } catch (e) {
      console.error("Failed to claim challenge reward:", e);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <>
      <Confetti
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      <div
        className={`relative rounded-2xl p-6 shadow-sm overflow-hidden transition-all ${
          isClaimed
            ? "bg-green-50 border-2 border-green-200"
            : isReadyToClaim
              ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300"
              : "bg-white"
        }`}
      >
        {/* Celebration shimmer when ready to claim */}
        {isReadyToClaim && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="challenge-shimmer" />
          </div>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{challenge.icon}</span>
              <h3 className="font-bold text-lg">אתגר שבועי</h3>
            </div>
            {isClaimed ? (
              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                <span>✅</span>
                <span>הושלם!</span>
              </div>
            ) : (
              <div
                className="px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: theme }}
              >
                +{challenge.reward} נקודות
              </div>
            )}
          </div>

          {/* Challenge Name */}
          <p
            className={`text-base mb-4 ${isClaimed ? "text-green-600 line-through" : "text-gray-700"}`}
          >
            {challenge.name}
          </p>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">התקדמות</span>
              <span className="text-sm font-bold" style={{ color: theme }}>
                {progress?.progress ?? 0} / {challenge.target}
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress?.percentage ?? 0}%`,
                  background: isClaimed
                    ? "#22c55e"
                    : isReadyToClaim
                      ? "linear-gradient(to left, #fbbf24, #f59e0b)"
                      : `linear-gradient(to left, ${theme}, ${theme}88)`,
                }}
              />
            </div>
          </div>

          {/* Claim Button */}
          {isReadyToClaim && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3 rounded-xl font-bold text-white text-lg transition-all hover:shadow-lg active:scale-95 animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${theme}, #fbbf24)`,
              }}
            >
              {claiming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>אוסף פרס...</span>
                </span>
              ) : (
                <span>🎁 אסוף {challenge.reward} נקודות בונוס!</span>
              )}
            </button>
          )}

          {/* Claimed State */}
          {isClaimed && (
            <div className="text-center text-green-600 font-medium text-sm">
              🏆 קיבלת {challenge.reward} נקודות בונוס! אתגר חדש בשבוע הבא
            </div>
          )}
        </div>

        <style jsx>{`
          .challenge-shimmer {
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              45deg,
              transparent 30%,
              rgba(251, 191, 36, 0.1) 50%,
              transparent 70%
            );
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%) rotate(45deg);
            }
            100% {
              transform: translateX(100%) rotate(45deg);
            }
          }
        `}</style>
      </div>
    </>
  );
}
