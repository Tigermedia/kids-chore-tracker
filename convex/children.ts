import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyChildAccess, getAuthenticatedFamily } from "./lib";

// List all children in the user's family
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

    const children = await ctx.db
      .query("children")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyMember.familyId))
      .collect();

    return children;
  },
});

// Get a specific child (with family ownership verification)
export const getChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const { child } = await verifyChildAccess(ctx, args.childId);
    return child;
  },
});

// Create a new child
export const createChild = mutation({
  args: {
    name: v.string(),
    avatar: v.string(),
    theme: v.string(),
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

    const childId = await ctx.db.insert("children", {
      familyId: familyMember.familyId,
      name: args.name,
      avatar: args.avatar,
      theme: args.theme,
      xp: 0,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalTasksCompleted: 0,
      createdAt: Date.now(),
    });

    // Create default morning tasks
    const morningTasks = [
      { name: "להתלבש", icon: "👕", points: 5 },
      { name: "לצחצח שיניים", icon: "🪥", points: 5 },
      { name: "לסדר את המיטה", icon: "🛏️", points: 10 },
      { name: "לאכול ארוחת בוקר", icon: "🥣", points: 5 },
    ];

    // Create default evening tasks
    const eveningTasks = [
      { name: "לסדר צעצועים", icon: "🧸", points: 10 },
      { name: "להתקלח", icon: "🚿", points: 10 },
      { name: "לצחצח שיניים", icon: "🪥", points: 5 },
      { name: "להכין תיק לבית ספר", icon: "🎒", points: 10 },
    ];

    for (const task of morningTasks) {
      await ctx.db.insert("taskTemplates", {
        childId,
        name: task.name,
        icon: task.icon,
        points: task.points,
        timeOfDay: "morning",
        hasTimer: false,
        requiresPhoto: false,
        isActive: true,
        isOneTime: false,
        createdAt: Date.now(),
      });
    }

    for (const task of eveningTasks) {
      await ctx.db.insert("taskTemplates", {
        childId,
        name: task.name,
        icon: task.icon,
        points: task.points,
        timeOfDay: "evening",
        hasTimer: false,
        requiresPhoto: false,
        isActive: true,
        isOneTime: false,
        createdAt: Date.now(),
      });
    }

    return childId;
  },
});

// Update a child (with family ownership verification)
export const updateChild = mutation({
  args: {
    childId: v.id("children"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    const { childId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(childId, filteredUpdates);
    return childId;
  },
});

// Delete a child (with family ownership verification)
export const deleteChild = mutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    // Delete related data
    const tasks = await ctx.db
      .query("taskTemplates")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    const completions = await ctx.db
      .query("taskCompletions")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .collect();

    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .collect();

    for (const achievement of achievements) {
      await ctx.db.delete(achievement._id);
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // Delete the child
    await ctx.db.delete(args.childId);
  },
});

// NOTE: addXP and addPoints were removed as dead code.
// XP and points are updated directly in tasks.completeTask.
