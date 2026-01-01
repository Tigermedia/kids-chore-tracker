import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Get task templates for a child
export const getTemplates = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("taskTemplates")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return templates;
  },
});

// Get task templates by time of day
export const getTemplatesByTimeOfDay = query({
  args: {
    childId: v.id("children"),
    timeOfDay: v.union(
      v.literal("morning"),
      v.literal("evening"),
      v.literal("special")
    ),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("taskTemplates")
      .withIndex("by_childId_timeOfDay", (q) =>
        q.eq("childId", args.childId).eq("timeOfDay", args.timeOfDay)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return templates;
  },
});

// Get today's tasks with completion status
export const getTodayTasks = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const today = getTodayDate();

    // Get all active templates for this child
    const templates = await ctx.db
      .query("taskTemplates")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get today's completions
    const completions = await ctx.db
      .query("taskCompletions")
      .withIndex("by_childId_date", (q) =>
        q.eq("childId", args.childId).eq("date", today)
      )
      .collect();

    // Map templates with completion status
    const tasks = templates.map((template) => {
      const completion = completions.find(
        (c) => c.taskTemplateId === template._id
      );
      return {
        ...template,
        isCompleted: !!completion,
        completedAt: completion?.completedAt,
        completionId: completion?._id,
      };
    });

    return tasks;
  },
});

// Complete a task
export const completeTask = mutation({
  args: {
    childId: v.id("children"),
    taskTemplateId: v.id("taskTemplates"),
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const today = getTodayDate();

    // Check if already completed today
    const existingCompletion = await ctx.db
      .query("taskCompletions")
      .withIndex("by_childId_date", (q) =>
        q.eq("childId", args.childId).eq("date", today)
      )
      .filter((q) => q.eq(q.field("taskTemplateId"), args.taskTemplateId))
      .unique();

    if (existingCompletion) {
      throw new Error("Task already completed today");
    }

    // Get task template
    const template = await ctx.db.get(args.taskTemplateId);
    if (!template) {
      throw new Error("Task template not found");
    }

    // Create completion
    const completionId = await ctx.db.insert("taskCompletions", {
      childId: args.childId,
      taskTemplateId: args.taskTemplateId,
      date: today,
      completedAt: Date.now(),
      points: template.points,
      photoStorageId: args.photoStorageId,
    });

    // Update child stats
    const child = await ctx.db.get(args.childId);
    if (child) {
      await ctx.db.patch(args.childId, {
        totalPoints: child.totalPoints + template.points,
        xp: child.xp + template.points,
        totalTasksCompleted: child.totalTasksCompleted + 1,
      });
    }

    return completionId;
  },
});

// Uncomplete a task (undo)
export const uncompleteTask = mutation({
  args: {
    completionId: v.id("taskCompletions"),
  },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.completionId);
    if (!completion) {
      throw new Error("Completion not found");
    }

    // Update child stats
    const child = await ctx.db.get(completion.childId);
    if (child) {
      await ctx.db.patch(completion.childId, {
        totalPoints: Math.max(0, child.totalPoints - completion.points),
        xp: Math.max(0, child.xp - completion.points),
        totalTasksCompleted: Math.max(0, child.totalTasksCompleted - 1),
      });
    }

    // Delete completion
    await ctx.db.delete(args.completionId);
  },
});

// Create a task template
export const createTemplate = mutation({
  args: {
    childId: v.id("children"),
    name: v.string(),
    icon: v.string(),
    points: v.number(),
    timeOfDay: v.union(
      v.literal("morning"),
      v.literal("evening"),
      v.literal("special")
    ),
    hasTimer: v.optional(v.boolean()),
    timerMinutes: v.optional(v.number()),
    requiresPhoto: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const templateId = await ctx.db.insert("taskTemplates", {
      childId: args.childId,
      name: args.name,
      icon: args.icon,
      points: args.points,
      timeOfDay: args.timeOfDay,
      hasTimer: args.hasTimer ?? false,
      timerMinutes: args.timerMinutes,
      requiresPhoto: args.requiresPhoto ?? false,
      isActive: true,
      isOneTime: false,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

// Update a task template
export const updateTemplate = mutation({
  args: {
    templateId: v.id("taskTemplates"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    points: v.optional(v.number()),
    timeOfDay: v.optional(
      v.union(
        v.literal("morning"),
        v.literal("evening"),
        v.literal("special")
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { templateId, ...updates } = args;

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(templateId, filteredUpdates);
    return templateId;
  },
});

// Delete a task template
export const deleteTemplate = mutation({
  args: { templateId: v.id("taskTemplates") },
  handler: async (ctx, args) => {
    // Delete all completions for this template
    const completions = await ctx.db
      .query("taskCompletions")
      .withIndex("by_taskTemplateId", (q) =>
        q.eq("taskTemplateId", args.templateId)
      )
      .collect();

    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    await ctx.db.delete(args.templateId);
  },
});

// Get task completion history
export const getCompletionHistory = query({
  args: {
    childId: v.id("children"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("taskCompletions")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(args.limit ?? 50);

    // Get template names
    const completionsWithNames = await Promise.all(
      completions.map(async (completion) => {
        const template = await ctx.db.get(completion.taskTemplateId);
        return {
          ...completion,
          taskName: template?.name ?? "Unknown",
          taskIcon: template?.icon ?? "❓",
        };
      })
    );

    return completionsWithNames;
  },
});
