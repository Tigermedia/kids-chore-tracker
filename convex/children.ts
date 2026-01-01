import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

// Get a specific child
export const getChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.childId);
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
    console.log("[createChild] Starting with args:", args);

    const identity = await ctx.auth.getUserIdentity();
    console.log("[createChild] Identity:", identity ? "Found" : "Not found");

    if (!identity) {
      console.error("[createChild] Not authenticated");
      throw new Error("Not authenticated");
    }

    console.log("[createChild] Looking up user with Clerk ID:", identity.subject);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    console.log("[createChild] User found:", user ? user._id : "Not found");

    if (!user) {
      console.error("[createChild] User not found in database");
      throw new Error("User not found");
    }

    console.log("[createChild] Looking up family member for user:", user._id);

    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    console.log("[createChild] Family member found:", familyMember ? familyMember.familyId : "Not found");

    if (!familyMember) {
      console.error("[createChild] Family not found for user");
      throw new Error("Family not found");
    }

    console.log("[createChild] Creating child in family:", familyMember.familyId);

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

    console.log("[createChild] Child created:", childId);

    // Create default morning tasks
    console.log("[createChild] Creating default morning tasks...");
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

    console.log("[createChild] Created", morningTasks.length, "morning tasks");

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

    console.log("[createChild] Created", eveningTasks.length, "evening tasks");
    console.log("[createChild] Completed successfully, returning child ID:", childId);

    return childId;
  },
});

// Update a child
export const updateChild = mutation({
  args: {
    childId: v.id("children"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { childId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(childId, filteredUpdates);
    return childId;
  },
});

// Delete a child
export const deleteChild = mutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
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

// Add XP to a child
export const addXP = mutation({
  args: {
    childId: v.id("children"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child) {
      throw new Error("Child not found");
    }

    const newXP = child.xp + args.amount;
    await ctx.db.patch(args.childId, { xp: newXP });

    return newXP;
  },
});

// Add points to a child
export const addPoints = mutation({
  args: {
    childId: v.id("children"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child) {
      throw new Error("Child not found");
    }

    const newPoints = child.totalPoints + args.amount;
    await ctx.db.patch(args.childId, { totalPoints: newPoints });

    return newPoints;
  },
});
