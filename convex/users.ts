import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    // Initialize default rewards for the new family
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
        familyId,
        ...reward,
        isActive: true,
        isDefault: true,
        createdAt: Date.now(),
      });
    }

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
    console.log("[ensureUser] Starting...");

    const identity = await ctx.auth.getUserIdentity();
    console.log("[ensureUser] Identity:", identity ? "Found" : "Not found");

    if (!identity) {
      console.error("[ensureUser] No identity found - user not authenticated");
      throw new Error("Not authenticated - please sign in");
    }

    // Extract user info from identity (handle various property names)
    const clerkId = identity.subject;
    const email = String(identity.email || identity.emailAddress || `${clerkId}@temp.local`);
    const name = identity.name ? String(identity.name) : identity.givenName ? String(identity.givenName) : undefined;
    // Clerk uses pictureUrl in Convex identity
    const imageUrl = identity.pictureUrl ? String(identity.pictureUrl) : undefined;

    console.log("[ensureUser] Clerk ID:", clerkId);
    console.log("[ensureUser] Email:", email);
    console.log("[ensureUser] Name:", name);

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
      console.log("[ensureUser] User found:", existingUser._id);

      // Check if user has a family
      const familyMember = await ctx.db
        .query("familyMembers")
        .withIndex("by_userId", (q) => q.eq("userId", existingUser._id))
        .first();

      if (!familyMember) {
        console.log("[ensureUser] No family found for user, creating...");

        // Create family for existing user
        const familyId = await ctx.db.insert("families", {
          name: existingUser.name ? `משפחת ${existingUser.name.split(" ")[0]}` : "המשפחה שלי",
          ownerId: existingUser._id,
          createdAt: Date.now(),
        });

        console.log("[ensureUser] Family created:", familyId);

        await ctx.db.insert("familyMembers", {
          familyId,
          userId: existingUser._id,
          role: "owner",
          joinedAt: Date.now(),
        });

        console.log("[ensureUser] Family member created");

        // Initialize default rewards for the new family
        console.log("[ensureUser] Initializing default rewards for existing user...");
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
            familyId,
            ...reward,
            isActive: true,
            isDefault: true,
            createdAt: Date.now(),
          });
        }

        console.log("[ensureUser] Created", defaultRewards.length, "default rewards");
      } else {
        console.log("[ensureUser] User already has family:", familyMember.familyId);
      }

      console.log("[ensureUser] Returning existing user ID:", existingUser._id);
      return existingUser._id;
    }

    console.log("[ensureUser] User not found, creating new user...");

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      imageUrl,
      createdAt: Date.now(),
    });

    console.log("[ensureUser] User created:", userId);

    // Create a default family for the user
    const familyId = await ctx.db.insert("families", {
      name: name ? `משפחת ${name.split(" ")[0]}` : "המשפחה שלי",
      ownerId: userId,
      createdAt: Date.now(),
    });

    console.log("[ensureUser] Family created:", familyId);

    // Add user as family owner
    await ctx.db.insert("familyMembers", {
      familyId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    console.log("[ensureUser] Family member created");

    // Initialize default rewards for the new family
    console.log("[ensureUser] Initializing default rewards...");
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
        familyId,
        ...reward,
        isActive: true,
        isDefault: true,
        createdAt: Date.now(),
      });
    }

    console.log("[ensureUser] Created", defaultRewards.length, "default rewards");
    console.log("[ensureUser] Completed successfully, returning user ID:", userId);

    return userId;
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

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
