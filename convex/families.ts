import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedFamily } from "./lib";

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

// ===== Account Sharing (Family Invites) =====

// Invite another parent by email
export const inviteParent = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, familyId } = await getAuthenticatedFamily(ctx);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("כתובת אימייל לא תקינה");
    }

    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if user is inviting themselves
    if (normalizedEmail === user.email.toLowerCase()) {
      throw new Error("לא ניתן להזמין את עצמך");
    }

    // Check if the email is already a family member
    const existingMembers = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();

    for (const member of existingMembers) {
      const memberUser = await ctx.db.get(member.userId);
      if (memberUser && memberUser.email.toLowerCase() === normalizedEmail) {
        throw new Error("משתמש זה כבר חבר במשפחה");
      }
    }

    // Check if there's already a pending invite for this email
    const existingInvites = await ctx.db
      .query("familyInvites")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();

    const pendingInvite = existingInvites.find(
      (inv) => inv.invitedEmail === normalizedEmail && inv.status === "pending"
    );
    if (pendingInvite) {
      throw new Error("כבר נשלחה הזמנה לכתובת זו");
    }

    // Create the invite
    await ctx.db.insert("familyInvites", {
      familyId,
      invitedEmail: normalizedEmail,
      invitedBy: user._id,
      status: "pending",
      createdAt: Date.now(),
    });

    return true;
  },
});

// Get pending invites for the current user's family (sent invites)
export const getPendingInvites = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!familyMember) return [];

    const invites = await ctx.db
      .query("familyInvites")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyMember.familyId))
      .collect();

    return invites.filter((inv) => inv.status === "pending");
  },
});

// Get invites addressed to the current user's email (received invites)
export const getMyInvites = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    const invites = await ctx.db
      .query("familyInvites")
      .withIndex("by_invitedEmail", (q) =>
        q.eq("invitedEmail", user.email.toLowerCase())
      )
      .collect();

    // Return pending invites with family info
    const pendingInvites = invites.filter((inv) => inv.status === "pending");
    const result = [];
    for (const invite of pendingInvites) {
      const family = await ctx.db.get(invite.familyId);
      const inviter = await ctx.db.get(invite.invitedBy);
      result.push({
        ...invite,
        familyName: family?.name ?? "משפחה",
        inviterName: inviter?.name ?? "משתמש",
      });
    }
    return result;
  },
});

// Accept an invite
export const acceptInvite = mutation({
  args: {
    inviteId: v.id("familyInvites"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("הזמנה לא נמצאה");
    if (invite.status !== "pending") throw new Error("הזמנה זו כבר טופלה");
    if (invite.invitedEmail !== user.email.toLowerCase()) {
      throw new Error("הזמנה זו לא מיועדת לך");
    }

    // Mark invite as accepted
    await ctx.db.patch(args.inviteId, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    // Remove user from their current family (if they own one with no children)
    const currentMembership = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (currentMembership) {
      // Check if the current family has children
      const currentChildren = await ctx.db
        .query("children")
        .withIndex("by_familyId", (q) =>
          q.eq("familyId", currentMembership.familyId)
        )
        .collect();

      // Check if there are other members in the family
      const otherMembers = await ctx.db
        .query("familyMembers")
        .withIndex("by_familyId", (q) =>
          q.eq("familyId", currentMembership.familyId)
        )
        .collect();

      const isOnlyMember = otherMembers.length === 1;

      // If user is the only member and no children, clean up the empty family
      if (isOnlyMember && currentChildren.length === 0) {
        // Delete empty family's rewards
        const rewards = await ctx.db
          .query("rewards")
          .withIndex("by_familyId", (q) =>
            q.eq("familyId", currentMembership.familyId)
          )
          .collect();
        for (const reward of rewards) {
          await ctx.db.delete(reward._id);
        }

        // Delete empty family's invites
        const invites = await ctx.db
          .query("familyInvites")
          .withIndex("by_familyId", (q) =>
            q.eq("familyId", currentMembership.familyId)
          )
          .collect();
        for (const inv of invites) {
          await ctx.db.delete(inv._id);
        }

        // Delete the family
        await ctx.db.delete(currentMembership.familyId);
      }

      // Remove current family membership
      await ctx.db.delete(currentMembership._id);
    }

    // Add user as a parent in the inviting family
    await ctx.db.insert("familyMembers", {
      familyId: invite.familyId,
      userId: user._id,
      role: "parent",
      joinedAt: Date.now(),
    });

    return true;
  },
});

// Decline an invite
export const declineInvite = mutation({
  args: {
    inviteId: v.id("familyInvites"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("הזמנה לא נמצאה");
    if (invite.status !== "pending") throw new Error("הזמנה זו כבר טופלה");

    await ctx.db.patch(args.inviteId, {
      status: "declined",
    });

    return true;
  },
});

// Cancel a pending invite (by the sender)
export const cancelInvite = mutation({
  args: {
    inviteId: v.id("familyInvites"),
  },
  handler: async (ctx, args) => {
    const { familyId } = await getAuthenticatedFamily(ctx);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("הזמנה לא נמצאה");
    if (invite.familyId !== familyId) throw new Error("אין הרשאה");
    if (invite.status !== "pending") throw new Error("הזמנה זו כבר טופלה");

    await ctx.db.delete(args.inviteId);
    return true;
  },
});

// Remove a family member (owner only)
export const removeFamilyMember = mutation({
  args: {
    memberId: v.id("familyMembers"),
  },
  handler: async (ctx, args) => {
    const { user, familyId } = await getAuthenticatedFamily(ctx);

    // Verify current user is the owner
    const family = await ctx.db.get(familyId);
    if (!family || family.ownerId !== user._id) {
      throw new Error("רק בעל המשפחה יכול להסיר חברים");
    }

    const memberToRemove = await ctx.db.get(args.memberId);
    if (!memberToRemove) throw new Error("חבר לא נמצא");
    if (memberToRemove.familyId !== familyId) throw new Error("אין הרשאה");
    if (memberToRemove.role === "owner") {
      throw new Error("לא ניתן להסיר את בעל המשפחה");
    }

    await ctx.db.delete(args.memberId);

    // Create a new empty family for the removed user so they don't get stuck
    const removedUser = await ctx.db.get(memberToRemove.userId);
    if (removedUser) {
      const newFamilyId = await ctx.db.insert("families", {
        name: removedUser.name
          ? `משפחת ${removedUser.name.split(" ")[0]}`
          : "המשפחה שלי",
        ownerId: removedUser._id,
        createdAt: Date.now(),
      });
      await ctx.db.insert("familyMembers", {
        familyId: newFamilyId,
        userId: removedUser._id,
        role: "owner",
        joinedAt: Date.now(),
      });
    }

    return true;
  },
});

// Get all family members with user info
export const getFamilyMembers = query({
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return [];

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!user) return [];

      const familyMember = await ctx.db
        .query("familyMembers")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (!familyMember) return [];

      const members = await ctx.db
        .query("familyMembers")
        .withIndex("by_familyId", (q) => q.eq("familyId", familyMember.familyId))
        .collect();

      const result = [];
      for (const member of members) {
        const memberUser = await ctx.db.get(member.userId);
        if (memberUser) {
          result.push({
            _id: member._id,
            userId: member.userId,
            role: member.role,
            joinedAt: member.joinedAt,
            name: memberUser.name ?? "משתמש",
            email: memberUser.email,
            imageUrl: memberUser.imageUrl ?? undefined,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("getFamilyMembers error:", error);
      return [];
    }
  },
});
