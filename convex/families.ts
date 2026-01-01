import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple hash function for PIN (not cryptographically secure, but fine for 4-digit PIN)
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Check if family has a PIN set
export const hasParentPin = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return false;
    }

    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!familyMember) {
      return false;
    }

    const family = await ctx.db.get(familyMember.familyId);
    return family?.parentPin !== undefined && family.parentPin !== null;
  },
});

// Set or update the parent PIN
export const setParentPin = mutation({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate PIN is exactly 4 digits
    if (!/^\d{4}$/.test(args.pin)) {
      throw new Error("PIN must be exactly 4 digits");
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
      throw new Error("No family found");
    }

    // Hash and store the PIN
    const hashedPin = hashPin(args.pin);
    await ctx.db.patch(familyMember.familyId, {
      parentPin: hashedPin,
    });

    return true;
  },
});

// Verify the parent PIN
export const verifyParentPin = mutation({
  args: {
    pin: v.string(),
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
      throw new Error("No family found");
    }

    const family = await ctx.db.get(familyMember.familyId);
    if (!family?.parentPin) {
      throw new Error("No PIN set");
    }

    // Hash the input and compare
    const hashedInput = hashPin(args.pin);
    return hashedInput === family.parentPin;
  },
});

// Update family name
export const updateFamilyName = mutation({
  args: {
    name: v.string(),
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
      throw new Error("No family found");
    }

    await ctx.db.patch(familyMember.familyId, {
      name: args.name,
    });

    return true;
  },
});
