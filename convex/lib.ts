import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/**
 * Get the authenticated user's family info.
 * Throws if not authenticated, user not found, or no family membership.
 */
export async function getAuthenticatedFamily(ctx: Ctx) {
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

  return { user, familyMember, familyId: familyMember.familyId };
}

/**
 * Verify that the authenticated user has access to the specified child.
 * Throws if child doesn't belong to the user's family.
 */
export async function verifyChildAccess(ctx: Ctx, childId: Id<"children">) {
  const { user, familyMember, familyId } = await getAuthenticatedFamily(ctx);

  const child = await ctx.db.get(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  if (child.familyId !== familyId) {
    throw new Error("Access denied - child does not belong to your family");
  }

  return { user, familyMember, child };
}
