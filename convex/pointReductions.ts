import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for image
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Create a point reduction (parent action)
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

    // Ensure points don't go below 0
    const newPoints = Math.max(0, child.totalPoints - args.points);

    // Deduct points from child
    await ctx.db.patch(args.childId, {
      totalPoints: newPoints,
    });

    // Create point reduction record
    const reductionId = await ctx.db.insert("pointReductions", {
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
      type: "point_reduction",
      title: "הורדת נקודות",
      message: `הורדו ${args.points} נקודות. סיבה: ${args.reason}`,
      relatedId: reductionId,
      isRead: false,
      createdAt: Date.now(),
    });

    return reductionId;
  },
});

// Get point reductions for a child
export const getByChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const reductions = await ctx.db
      .query("pointReductions")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(50);

    return reductions;
  },
});

// Get a specific point reduction with image URL
export const getWithImage = query({
  args: { reductionId: v.id("pointReductions") },
  handler: async (ctx, args) => {
    const reduction = await ctx.db.get(args.reductionId);
    if (!reduction) {
      return null;
    }

    let imageUrl = null;
    if (reduction.imageStorageId) {
      imageUrl = await ctx.storage.getUrl(reduction.imageStorageId);
    }

    return {
      ...reduction,
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

// Acknowledge a point reduction
export const acknowledge = mutation({
  args: { reductionId: v.id("pointReductions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reductionId, {
      isAcknowledged: true,
      acknowledgedAt: Date.now(),
    });
  },
});

// Get unacknowledged reductions for a child
export const getUnacknowledged = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const reductions = await ctx.db
      .query("pointReductions")
      .withIndex("by_childId_acknowledged", (q) =>
        q.eq("childId", args.childId).eq("isAcknowledged", false)
      )
      .collect();

    // Get image URLs for each reduction
    const reductionsWithImages = await Promise.all(
      reductions.map(async (reduction) => {
        let imageUrl = null;
        if (reduction.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(reduction.imageStorageId);
        }
        return { ...reduction, imageUrl };
      })
    );

    return reductionsWithImages;
  },
});
