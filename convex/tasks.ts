import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyChildAccess, getAuthenticatedFamily } from "./lib";

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Get yesterday's date in YYYY-MM-DD format
function getYesterdayDate(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().split("T")[0];
}

// Get Monday of the current week (YYYY-MM-DD)
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

// Get first day of current month (YYYY-MM-DD)
function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

// Get task templates for a child (with family ownership verification)
export const getTemplates = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    const templates = await ctx.db
      .query("taskTemplates")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return templates;
  },
});

// Get task templates by time of day (with family ownership verification)
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
    await verifyChildAccess(ctx, args.childId);

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

// Get today's tasks with completion status (with family ownership verification)
export const getTodayTasks = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

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

    // For frequency-based tasks, get completions since period start
    const weekStart = getWeekStart();
    const monthStart = getMonthStart();

    // Map templates with completion status, filtering by frequency
    const tasksPromises = templates.map(async (template) => {
      const frequency = template.frequency || "daily";

      // For "once" tasks: check if ever completed
      if (frequency === "once") {
        const anyCompletion = await ctx.db
          .query("taskCompletions")
          .withIndex("by_taskTemplateId", (q) =>
            q.eq("taskTemplateId", template._id)
          )
          .first();
        if (anyCompletion) {
          // Already completed once - hide from list
          // Note: deactivation happens in completeTask mutation
          return null;
        }
        const todayCompletion = completions.find(
          (c) => c.taskTemplateId === template._id
        );
        return {
          ...template,
          isCompleted: !!todayCompletion,
          completedAt: todayCompletion?.completedAt,
          completionId: todayCompletion?._id,
        };
      }

      // For "weekly" tasks: check if completed this week
      if (frequency === "weekly") {
        const weekCompletions = await ctx.db
          .query("taskCompletions")
          .withIndex("by_taskTemplateId", (q) =>
            q.eq("taskTemplateId", template._id)
          )
          .filter((q) => q.gte(q.field("date"), weekStart))
          .first();
        return {
          ...template,
          isCompleted: !!weekCompletions,
          completedAt: weekCompletions?.completedAt,
          completionId: weekCompletions?._id,
        };
      }

      // For "monthly" tasks: check if completed this month
      if (frequency === "monthly") {
        const monthCompletions = await ctx.db
          .query("taskCompletions")
          .withIndex("by_taskTemplateId", (q) =>
            q.eq("taskTemplateId", template._id)
          )
          .filter((q) => q.gte(q.field("date"), monthStart))
          .first();
        return {
          ...template,
          isCompleted: !!monthCompletions,
          completedAt: monthCompletions?.completedAt,
          completionId: monthCompletions?._id,
        };
      }

      // Default "daily": check today only
      const todayCompletion = completions.find(
        (c) => c.taskTemplateId === template._id
      );
      return {
        ...template,
        isCompleted: !!todayCompletion,
        completedAt: todayCompletion?.completedAt,
        completionId: todayCompletion?._id,
      };
    });

    const tasks = (await Promise.all(tasksPromises)).filter(
      (t): t is NonNullable<typeof t> => t !== null
    );

    return tasks;
  },
});

// Complete a task (with family ownership verification + streak logic + achievement check)
export const completeTask = mutation({
  args: {
    childId: v.id("children"),
    taskTemplateId: v.id("taskTemplates"),
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { child } = await verifyChildAccess(ctx, args.childId);

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

    // --- Streak logic ---
    // Check if this is the first completion today (before we created ours, there were none)
    const existingTodayCompletion = await ctx.db
      .query("taskCompletions")
      .withIndex("by_childId_date", (q) =>
        q.eq("childId", args.childId).eq("date", today)
      )
      .filter((q) => q.neq(q.field("_id"), completionId))
      .first();

    let newStreak = child.currentStreak;
    if (!existingTodayCompletion) {
      // This is the first completion today — update streak
      const yesterday = getYesterdayDate();
      const yesterdayCompletion = await ctx.db
        .query("taskCompletions")
        .withIndex("by_childId_date", (q) =>
          q.eq("childId", args.childId).eq("date", yesterday)
        )
        .first();

      if (yesterdayCompletion) {
        // Continuing streak from yesterday
        newStreak = child.currentStreak + 1;
      } else {
        // No activity yesterday — start new streak
        newStreak = 1;
      }
    }

    // Update child stats (points, XP, tasks completed, streak)
    await ctx.db.patch(args.childId, {
      totalPoints: child.totalPoints + template.points,
      xp: child.xp + template.points,
      totalTasksCompleted: child.totalTasksCompleted + 1,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, child.longestStreak),
    });

    // --- Achievement auto-check ---
    await ctx.scheduler.runAfter(
      0,
      internal.achievements.checkAndUnlockInternal,
      { childId: args.childId }
    );

    return completionId;
  },
});

// Uncomplete a task (undo) (with family ownership verification)
export const uncompleteTask = mutation({
  args: {
    completionId: v.id("taskCompletions"),
  },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.completionId);
    if (!completion) {
      throw new Error("Completion not found");
    }

    // Verify family access via the child
    await verifyChildAccess(ctx, completion.childId);

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

// Create a task template (with family ownership verification)
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
    frequency: v.optional(v.union(
      v.literal("once"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    )),
  },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

    const frequency = args.frequency ?? "daily";

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
      isOneTime: frequency === "once",
      frequency: frequency,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

// Update a task template (with family ownership verification)
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
    frequency: v.optional(v.union(
      v.literal("once"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    )),
  },
  handler: async (ctx, args) => {
    // Get the template to find the childId for verification
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Task template not found");
    }
    await verifyChildAccess(ctx, template.childId);

    const { templateId, ...updates } = args;

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(templateId, filteredUpdates);
    return templateId;
  },
});

// Delete a task template (with family ownership verification)
export const deleteTemplate = mutation({
  args: { templateId: v.id("taskTemplates") },
  handler: async (ctx, args) => {
    // Get the template to find the childId for verification
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Task template not found");
    }
    await verifyChildAccess(ctx, template.childId);

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

// Get task completion history (with family ownership verification)
export const getCompletionHistory = query({
  args: {
    childId: v.id("children"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyChildAccess(ctx, args.childId);

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
