import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Default rewards data
const DEFAULT_REWARDS = [
  { name: "30 דקות טלוויזיה", icon: "📺", description: "30 דקות צפייה בטלוויזיה", cost: 50 },
  { name: "גלידה", icon: "🍦", description: "גלידה לבחירתך", cost: 75 },
  { name: "משחק מחשב", icon: "🎮", description: "30 דקות משחקי מחשב", cost: 60 },
  { name: "לילה להישאר ער", icon: "🌙", description: "להישאר ער חצי שעה יותר", cost: 100 },
  { name: "מתנה קטנה", icon: "🎁", description: "מתנה הפתעה קטנה", cost: 200 },
  { name: "יום בילוי", icon: "🎢", description: "יום כיף לבחירתך", cost: 500 },
];

// Internal mutation for initializing rewards (called from users.ts)
export const initializeDefaultRewardsInternal = internalMutation({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    // Check if rewards already exist for this family
    const existingRewards = await ctx.db
      .query("rewards")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .first();

    if (existingRewards) {
      return; // Rewards already initialized
    }

    for (const reward of DEFAULT_REWARDS) {
      await ctx.db.insert("rewards", {
        familyId: args.familyId,
        ...reward,
        isActive: true,
        isDefault: true,
        createdAt: Date.now(),
      });
    }
  },
});

// Get all rewards for a family
export const listByFamily = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!familyMember) {
      return [];
    }

    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyMember.familyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return rewards;
  },
});

// Get all rewards (including inactive) for parent management
export const listAllByFamily = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!familyMember) {
      return [];
    }

    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyMember.familyId))
      .collect();

    return rewards;
  },
});

// Create a reward
export const create = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    description: v.string(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!familyMember) {
      throw new Error("Family not found");
    }

    const rewardId = await ctx.db.insert("rewards", {
      familyId: familyMember.familyId,
      name: args.name,
      icon: args.icon,
      description: args.description,
      cost: args.cost,
      isActive: true,
      isDefault: false,
      createdAt: Date.now(),
    });

    return rewardId;
  },
});

// Update a reward
export const update = mutation({
  args: {
    rewardId: v.id("rewards"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    cost: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { rewardId, ...updates } = args;

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(rewardId, filteredUpdates);
    return rewardId;
  },
});

// Delete a reward
export const deleteReward = mutation({
  args: { rewardId: v.id("rewards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.rewardId);
  },
});

// Purchase a reward
export const purchase = mutation({
  args: {
    childId: v.id("children"),
    rewardId: v.id("rewards"),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child) {
      throw new Error("Child not found");
    }

    const reward = await ctx.db.get(args.rewardId);
    if (!reward) {
      throw new Error("Reward not found");
    }

    if (child.totalPoints < reward.cost) {
      throw new Error("Not enough points");
    }

    // Deduct points
    await ctx.db.patch(args.childId, {
      totalPoints: child.totalPoints - reward.cost,
    });

    // Create purchase record
    const purchaseId = await ctx.db.insert("purchases", {
      childId: args.childId,
      rewardId: args.rewardId,
      cost: reward.cost,
      purchasedAt: Date.now(),
      isRedeemed: false,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      childId: args.childId,
      type: "reward_available",
      title: "פרס נרכש!",
      message: `רכשת: ${reward.name}`,
      relatedId: purchaseId,
      isRead: false,
      createdAt: Date.now(),
    });

    return purchaseId;
  },
});

// Get purchases for a child
export const getPurchases = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .order("desc")
      .collect();

    // Get reward details
    const purchasesWithRewards = await Promise.all(
      purchases.map(async (purchase) => {
        const reward = await ctx.db.get(purchase.rewardId);
        return {
          ...purchase,
          rewardName: reward?.name ?? "Unknown",
          rewardIcon: reward?.icon ?? "🎁",
        };
      })
    );

    return purchasesWithRewards;
  },
});

// Get unredeemed purchases for a child
export const getUnredeemedPurchases = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .filter((q) => q.eq(q.field("isRedeemed"), false))
      .collect();

    const purchasesWithRewards = await Promise.all(
      purchases.map(async (purchase) => {
        const reward = await ctx.db.get(purchase.rewardId);
        return {
          ...purchase,
          rewardName: reward?.name ?? "Unknown",
          rewardIcon: reward?.icon ?? "🎁",
          rewardDescription: reward?.description ?? "",
        };
      })
    );

    return purchasesWithRewards;
  },
});

// Redeem a purchase
export const redeem = mutation({
  args: { purchaseId: v.id("purchases") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.purchaseId, {
      isRedeemed: true,
      redeemedAt: Date.now(),
    });
  },
});

// Initialize default rewards for a family
export const initializeDefaultRewards = mutation({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const defaultRewards = [
      { name: "30 דקות טלוויזיה", icon: "📺", description: "30 דקות צפייה בטלוויזיה", cost: 50 },
      { name: "גלידה", icon: "🍦", description: "גלידה לבחירתך", cost: 75 },
      { name: "משחק מחשב", icon: "🎮", description: "30 דקות משחקי מחשב", cost: 60 },
      { name: "לילה להישאר ער", icon: "🌙", description: "להישאר ער חצי שעה יותר", cost: 100 },
      { name: "מתנה קטנה", icon: "🎁", description: "מתנה הפתעה קטנה", cost: 200 },
      { name: "יום בילוי", icon: "🎢", description: "יום כיף לבחירתך", cost: 500 },
    ];

    for (const reward of defaultRewards) {
      await ctx.db.insert("rewards", {
        familyId: args.familyId,
        ...reward,
        isActive: true,
        isDefault: true,
        createdAt: Date.now(),
      });
    }
  },
});
