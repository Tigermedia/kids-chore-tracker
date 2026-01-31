import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { verifyChildAccess } from "./lib";

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Get the Monday of the current week (YYYY-MM-DD)
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday, 1=Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
  now.setDate(now.getDate() + diff);
  return now.toISOString().split("T")[0];
}

// Get the Sunday of the current week (YYYY-MM-DD)
function getWeekEnd(weekStart: string): string {
  const date = new Date(weekStart + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + 6);
  return date.toISOString().split("T")[0];
}

// Challenge definitions to rotate through
const CHALLENGE_TYPES = [
  {
    challengeType: "morning_tasks",
    name: "השלם 5 משימות בוקר השבוע",
    icon: "🌅",
    target: 5,
    reward: 20,
  },
  {
    challengeType: "consecutive_days",
    name: "השלם 3 ימים רצופים",
    icon: "🔥",
    target: 3,
    reward: 25,
  },
  {
    challengeType: "weekly_points",
    name: "צבור 50 נקודות השבוע",
    icon: "⭐",
    target: 50,
    reward: 15,
  },
  {
    challengeType: "evening_complete",
    name: "השלם את כל משימות הערב 3 פעמים",
    icon: "🌙",
    target: 3,
    reward: 30,
  },
  {
    challengeType: "total_tasks",
    name: "השלם 15 משימות סה״כ השבוע",
    icon: "🏆",
    target: 15,
    reward: 20,
  },
];

// Shared progress calculation helper
async function computeProgress(
  ctx: { db: QueryCtx["db"] | MutationCtx["db"] },
  childId: Id<"children">,
  challengeType: string,
  weekStart: string
): Promise<number> {
  const weekEnd = getWeekEnd(weekStart);

  // Get all completions for this child
  const allCompletions = await ctx.db
    .query("taskCompletions")
    .withIndex("by_childId", (q) => q.eq("childId", childId))
    .collect();

  // Filter to this week's completions
  const weekCompletions = allCompletions.filter(
    (c) => c.date >= weekStart && c.date <= weekEnd
  );

  switch (challengeType) {
    case "morning_tasks": {
      // Count morning task completions this week
      const morningTemplates = await ctx.db
        .query("taskTemplates")
        .withIndex("by_childId_timeOfDay", (q) =>
          q.eq("childId", childId).eq("timeOfDay", "morning")
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const morningTemplateIds = new Set(
        morningTemplates.map((t) => t._id.toString())
      );
      return weekCompletions.filter((c) =>
        morningTemplateIds.has(c.taskTemplateId.toString())
      ).length;
    }

    case "consecutive_days": {
      // Count max consecutive days with completions this week
      const datesWithCompletions = [
        ...new Set(weekCompletions.map((c) => c.date)),
      ].sort();

      if (datesWithCompletions.length === 0) return 0;

      let maxConsecutive = 1;
      let current = 1;

      for (let i = 1; i < datesWithCompletions.length; i++) {
        const prev = new Date(datesWithCompletions[i - 1] + "T00:00:00Z");
        const curr = new Date(datesWithCompletions[i] + "T00:00:00Z");
        const diffDays =
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          current++;
          maxConsecutive = Math.max(maxConsecutive, current);
        } else {
          current = 1;
        }
      }

      return maxConsecutive;
    }

    case "weekly_points": {
      return weekCompletions.reduce((sum, c) => sum + c.points, 0);
    }

    case "evening_complete": {
      // Count days where ALL evening tasks were completed
      const eveningTemplates = await ctx.db
        .query("taskTemplates")
        .withIndex("by_childId_timeOfDay", (q) =>
          q.eq("childId", childId).eq("timeOfDay", "evening")
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      if (eveningTemplates.length === 0) return 0;

      const eveningTemplateIds = new Set(
        eveningTemplates.map((t) => t._id.toString())
      );
      const dates = [...new Set(weekCompletions.map((c) => c.date))];

      let fullEveningDays = 0;
      for (const date of dates) {
        const dayCompletions = weekCompletions.filter((c) => c.date === date);
        const completedEveningIds = new Set(
          dayCompletions
            .filter((c) =>
              eveningTemplateIds.has(c.taskTemplateId.toString())
            )
            .map((c) => c.taskTemplateId.toString())
        );

        if (completedEveningIds.size >= eveningTemplateIds.size) {
          fullEveningDays++;
        }
      }

      return fullEveningDays;
    }

    case "total_tasks": {
      return weekCompletions.length;
    }

    default:
      return 0;
  }
}

// Get current week's active challenge for a child
export const getActiveChallenge = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    const weekStart = getWeekStart();

    const challenge = await ctx.db
      .query("challenges")
      .withIndex("by_childId_weekStart", (q) =>
        q.eq("childId", args.childId).eq("weekStart", weekStart)
      )
      .unique();

    return challenge;
  },
});

// Calculate progress for a specific challenge
export const getChallengeProgress = query({
  args: {
    childId: v.id("children"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.childId !== args.childId)
      throw new Error("Challenge does not belong to this child");

    const progress = await computeProgress(
      ctx,
      args.childId,
      challenge.challengeType,
      challenge.weekStart
    );

    const clampedProgress = Math.min(progress, challenge.target);

    return {
      progress: clampedProgress,
      target: challenge.target,
      percentage: Math.min(
        100,
        Math.round((clampedProgress / challenge.target) * 100)
      ),
      isCompleted: progress >= challenge.target,
    };
  },
});

// Initialize a weekly challenge for a child (idempotent)
export const initializeWeeklyChallenge = mutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    const weekStart = getWeekStart();

    // Check if challenge already exists for this week
    const existing = await ctx.db
      .query("challenges")
      .withIndex("by_childId_weekStart", (q) =>
        q.eq("childId", args.childId).eq("weekStart", weekStart)
      )
      .unique();

    if (existing) return existing._id;

    // Get previous challenges to avoid repeating recent types
    const previousChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(5);

    const recentTypes = previousChallenges.map((c) => c.challengeType);

    // Pick a challenge type not used recently
    let selectedChallenge = CHALLENGE_TYPES.find(
      (ct) => !recentTypes.includes(ct.challengeType)
    );

    if (!selectedChallenge) {
      // All types used recently, pick random
      selectedChallenge =
        CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
    }

    const challengeId = await ctx.db.insert("challenges", {
      childId: args.childId,
      weekStart,
      challengeType: selectedChallenge.challengeType,
      name: selectedChallenge.name,
      icon: selectedChallenge.icon,
      target: selectedChallenge.target,
      reward: selectedChallenge.reward,
      progress: 0,
      isCompleted: false,
    });

    return challengeId;
  },
});

// Claim bonus points for a completed challenge
export const claimChallengeReward = mutation({
  args: {
    childId: v.id("children"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const { child } = await verifyChildAccess(ctx, args.childId);

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.childId !== args.childId)
      throw new Error("Challenge does not belong to this child");
    if (challenge.isCompleted)
      throw new Error("Challenge reward already claimed");

    // Verify progress actually meets the target
    const progress = await computeProgress(
      ctx,
      args.childId,
      challenge.challengeType,
      challenge.weekStart
    );

    if (progress < challenge.target) {
      throw new Error("Challenge not yet completed");
    }

    // Mark as completed (claimed)
    await ctx.db.patch(args.challengeId, {
      isCompleted: true,
      completedAt: Date.now(),
      progress: Math.min(progress, challenge.target),
    });

    // Award points
    await ctx.db.patch(args.childId, {
      totalPoints: child.totalPoints + challenge.reward,
      xp: child.xp + challenge.reward,
    });

    return challenge.reward;
  },
});
