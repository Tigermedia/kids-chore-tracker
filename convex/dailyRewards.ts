import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyChildAccess } from "./lib";

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Get yesterday's date in YYYY-MM-DD format
function getYesterdayDate(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().split("T")[0];
}

// Check if child already claimed today's reward
export const getDailyReward = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    const today = getTodayDate();

    // Check if claimed today
    const todayClaim = await ctx.db
      .query("dailyRewardClaims")
      .withIndex("by_childId_date", (q) =>
        q.eq("childId", args.childId).eq("date", today)
      )
      .unique();

    // Get streak info
    const rewardTracker = await ctx.db
      .query("dailyRewards")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .unique();

    return {
      claimedToday: !!todayClaim,
      pointsAwarded: todayClaim?.pointsAwarded ?? null,
      isJackpot: todayClaim?.isJackpot ?? false,
      streak: rewardTracker?.streak ?? 0,
    };
  },
});

// Claim today's daily reward (random 1-10 points, 5% chance for 25-point jackpot)
export const claimDailyReward = mutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const { child } = await verifyChildAccess(ctx, args.childId);

    const today = getTodayDate();

    // Enforce one claim per day
    const existingClaim = await ctx.db
      .query("dailyRewardClaims")
      .withIndex("by_childId_date", (q) =>
        q.eq("childId", args.childId).eq("date", today)
      )
      .unique();

    if (existingClaim) {
      throw new Error("Already claimed today's reward");
    }

    // Calculate reward: 5% jackpot (25 points), otherwise random 1-10
    const isJackpot = Math.random() < 0.05;
    const pointsAwarded = isJackpot
      ? 25
      : Math.floor(Math.random() * 10) + 1;

    // Create claim record
    await ctx.db.insert("dailyRewardClaims", {
      childId: args.childId,
      date: today,
      pointsAwarded,
      isJackpot,
      claimedAt: Date.now(),
    });

    // Update streak tracker
    const yesterday = getYesterdayDate();
    const rewardTracker = await ctx.db
      .query("dailyRewards")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .unique();

    if (rewardTracker) {
      const newStreak =
        rewardTracker.lastClaimDate === yesterday
          ? rewardTracker.streak + 1
          : 1;
      await ctx.db.patch(rewardTracker._id, {
        lastClaimDate: today,
        streak: newStreak,
      });
    } else {
      await ctx.db.insert("dailyRewards", {
        childId: args.childId,
        lastClaimDate: today,
        streak: 1,
      });
    }

    // Award points to child
    await ctx.db.patch(args.childId, {
      totalPoints: child.totalPoints + pointsAwarded,
      xp: child.xp + pointsAwarded,
    });

    return { pointsAwarded, isJackpot };
  },
});

// Get last N daily reward claims for a child
export const getDailyRewardHistory = query({
  args: {
    childId: v.id("children"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    const claims = await ctx.db
      .query("dailyRewardClaims")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(args.limit ?? 10);

    return claims;
  },
});
