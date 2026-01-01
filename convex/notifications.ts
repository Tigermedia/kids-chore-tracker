import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get notifications for a child
export const getByChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(50);

    return notifications;
  },
});

// Get unread notifications count
export const getUnreadCount = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_childId_isRead", (q) =>
        q.eq("childId", args.childId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

// Get unread notifications
export const getUnread = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_childId_isRead", (q) =>
        q.eq("childId", args.childId).eq("isRead", false)
      )
      .order("desc")
      .collect();

    return notifications;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

// Mark all notifications as read for a child
export const markAllAsRead = mutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_childId_isRead", (q) =>
        q.eq("childId", args.childId).eq("isRead", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

// Create a notification
export const create = mutation({
  args: {
    childId: v.id("children"),
    type: v.union(
      v.literal("point_reduction"),
      v.literal("achievement"),
      v.literal("level_up"),
      v.literal("challenge_complete"),
      v.literal("reward_available"),
      v.literal("streak_reminder")
    ),
    title: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      childId: args.childId,
      type: args.type,
      title: args.title,
      message: args.message,
      relatedId: args.relatedId,
      isRead: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});
