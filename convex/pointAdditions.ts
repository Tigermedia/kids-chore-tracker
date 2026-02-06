import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Generate upload URL for image
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Create a point addition (parent action)
export const create = mutation({
  args: {
    childId: v.id("children"),
    points: v.number(),
    reason: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get parent user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get child and verify family access
    const child = await ctx.db.get(args.childId);
    if (!child) {
      throw new Error("Child not found");
    }

    // Verify parent has access to this child's family
    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("familyId"), child.familyId))
      .unique();

    if (!familyMember) {
      throw new Error("Access denied - you are not part of this family");
    }

    // Add points to child
    const newPoints = child.totalPoints + args.points;

    await ctx.db.patch(args.childId, {
      totalPoints: newPoints,
    });

    // Create point addition record
    const additionId = await ctx.db.insert("pointAdditions", {
      childId: args.childId,
      parentId: user._id,
      points: args.points,
      reason: args.reason,
      imageStorageId: args.imageStorageId,
      createdAt: Date.now(),
      isAcknowledged: false,
    });

    // Create notification for child
    await ctx.db.insert("notifications", {
      childId: args.childId,
      type: "point_addition",
      title: "קיבלת נקודות! 🎉",
      message: `קיבלת ${args.points} נקודות! סיבה: ${args.reason}`,
      relatedId: additionId,
      isRead: false,
      createdAt: Date.now(),
    });

    // Check for helper achievements
    const allAdditions = await ctx.db
      .query("pointAdditions")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .collect();

    const additionCount = allAdditions.length;

    // Unlock helper achievements
    if (additionCount >= 1) {
      await ctx.scheduler.runAfter(0, internal.achievements.checkAndUnlockInternal, {
        childId: args.childId,
      });
    }

    return additionId;
  },
});

// Get point additions for a child
export const getByChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const additions = await ctx.db
      .query("pointAdditions")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(50);

    return additions;
  },
});

// Get a specific point addition with image URL
export const getWithImage = query({
  args: { additionId: v.id("pointAdditions") },
  handler: async (ctx, args) => {
    const addition = await ctx.db.get(args.additionId);
    if (!addition) {
      return null;
    }

    let imageUrl = null;
    if (addition.imageStorageId) {
      imageUrl = await ctx.storage.getUrl(addition.imageStorageId);
    }

    return {
      ...addition,
      imageUrl,
    };
  },
});

// Get image URL for a storage ID
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Acknowledge a point addition
export const acknowledge = mutation({
  args: { additionId: v.id("pointAdditions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.additionId, {
      isAcknowledged: true,
      acknowledgedAt: Date.now(),
    });
  },
});

// Get unacknowledged additions for a child
export const getUnacknowledged = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const additions = await ctx.db
      .query("pointAdditions")
      .withIndex("by_childId_acknowledged", (q) =>
        q.eq("childId", args.childId).eq("isAcknowledged", false)
      )
      .collect();

    // Get image URLs for each addition
    const additionsWithImages = await Promise.all(
      additions.map(async (addition) => {
        let imageUrl = null;
        if (addition.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(addition.imageStorageId);
        }
        return { ...addition, imageUrl };
      })
    );

    return additionsWithImages;
  },
});
