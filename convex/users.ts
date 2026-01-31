import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Create a new user (called from Clerk webhook)
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });

    // Create a default family for the user
    const familyId = await ctx.db.insert("families", {
      name: args.name ? `משפחת ${args.name.split(" ")[0]}` : "המשפחה שלי",
      ownerId: userId,
      createdAt: Date.now(),
    });

    // Add user as family owner
    await ctx.db.insert("familyMembers", {
      familyId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    // Initialize default rewards for the family
    await ctx.scheduler.runAfter(0, internal.rewards.initializeDefaultRewardsInternal, { familyId });

    return userId;
  },
});

// Update user (called from Clerk webhook)
export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      imageUrl: args.imageUrl,
    });

    return user._id;
  },
});

// Get current user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

// Ensure user exists (create if not) - fallback if webhook didn't work
export const ensureUser = mutation({
  handler: async (ctx) => {
    console.log("ensureUser: Starting...");
    try {
      const identity = await ctx.auth.getUserIdentity();
      console.log("ensureUser: Got identity:", identity ? "exists" : "null");
      if (!identity) {
        throw new Error("Not authenticated - please sign in");
      }

      // Extract user info from identity
      const clerkId = identity.subject;
      console.log("ensureUser: clerkId:", clerkId);
      // Use only standard Convex identity properties
      const email = identity.email ?? `${clerkId}@temp.local`;
      const name = identity.name ?? undefined;
      const imageUrl = identity.pictureUrl ?? undefined;
      console.log("ensureUser: email:", email, "name:", name);

      // Check if user already exists
      console.log("ensureUser: Querying for existing user...");
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
        .unique();
      console.log("ensureUser: existingUser:", existingUser ? "found" : "not found");

      if (existingUser) {
        console.log("ensureUser: Checking family membership...");
        // Check if user has a family
        const familyMember = await ctx.db
          .query("familyMembers")
          .withIndex("by_userId", (q) => q.eq("userId", existingUser._id))
          .first();
        console.log("ensureUser: familyMember:", familyMember ? "found" : "not found");

        if (!familyMember) {
          console.log("ensureUser: Creating family for existing user...");
          // Create family for existing user
          const familyId = await ctx.db.insert("families", {
            name: existingUser.name ? `משפחת ${existingUser.name.split(" ")[0]}` : "המשפחה שלי",
            ownerId: existingUser._id,
            createdAt: Date.now(),
          });
          console.log("ensureUser: Family created:", familyId);

          await ctx.db.insert("familyMembers", {
            familyId,
            userId: existingUser._id,
            role: "owner",
            joinedAt: Date.now(),
          });
          console.log("ensureUser: FamilyMember created");

          // Initialize default rewards
          await ctx.scheduler.runAfter(0, internal.rewards.initializeDefaultRewardsInternal, { familyId });
          console.log("ensureUser: Default rewards scheduled");
        }

        console.log("ensureUser: Returning existing user:", existingUser._id);
        return existingUser._id;
      }

      // Create new user
      console.log("ensureUser: Creating new user...");
      const userId = await ctx.db.insert("users", {
        clerkId,
        email,
        name,
        imageUrl,
        createdAt: Date.now(),
      });
      console.log("ensureUser: User created:", userId);

      // Create a default family for the user
      console.log("ensureUser: Creating family...");
      const familyId = await ctx.db.insert("families", {
        name: name ? `משפחת ${name.split(" ")[0]}` : "המשפחה שלי",
        ownerId: userId,
        createdAt: Date.now(),
      });
      console.log("ensureUser: Family created:", familyId);

      // Add user as family owner
      console.log("ensureUser: Creating family member...");
      await ctx.db.insert("familyMembers", {
        familyId,
        userId,
        role: "owner",
        joinedAt: Date.now(),
      });

      // Initialize default rewards
      await ctx.scheduler.runAfter(0, internal.rewards.initializeDefaultRewardsInternal, { familyId });
      console.log("ensureUser: Default rewards scheduled");
      console.log("ensureUser: Complete! Returning:", userId);

      return userId;
    } catch (error) {
      // Log the actual error for debugging
      console.error("ensureUser error:", error);
      throw error;
    }
  },
});

// NOTE: getUserByClerkId was removed as dead code.
// Use getCurrentUser instead (which gets clerkId from auth identity).

// Get user's family
export const getUserFamily = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!familyMember) {
      return null;
    }

    const family = await ctx.db.get(familyMember.familyId);
    return family;
  },
});
