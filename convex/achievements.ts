import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS = [
  // Task milestones
  { id: "first_task", name: "צעד ראשון", icon: "🌟", description: "השלמת משימה ראשונה", category: "tasks" },
  { id: "tasks_10", name: "מתחיל", icon: "⭐", description: "השלמת 10 משימות", category: "tasks" },
  { id: "tasks_50", name: "חרוץ", icon: "💫", description: "השלמת 50 משימות", category: "tasks" },
  { id: "tasks_100", name: "כוכב", icon: "🏆", description: "השלמת 100 משימות", category: "tasks" },
  { id: "tasks_500", name: "אלוף", icon: "👑", description: "השלמת 500 משימות", category: "tasks" },

  // Streak achievements
  { id: "streak_3", name: "רצף קטן", icon: "🔥", description: "3 ימים ברצף", category: "streak" },
  { id: "streak_7", name: "שבוע מושלם", icon: "🔥", description: "7 ימים ברצף", category: "streak" },
  { id: "streak_14", name: "שבועיים!", icon: "🔥", description: "14 ימים ברצף", category: "streak" },
  { id: "streak_30", name: "חודש מדהים", icon: "🔥", description: "30 ימים ברצף", category: "streak" },

  // Points achievements
  { id: "points_100", name: "אספן מתחיל", icon: "💰", description: "אספת 100 נקודות", category: "points" },
  { id: "points_500", name: "אספן מקצועי", icon: "💰", description: "אספת 500 נקודות", category: "points" },
  { id: "points_1000", name: "עשיר", icon: "💎", description: "אספת 1000 נקודות", category: "points" },

  // Level achievements
  { id: "level_5", name: "מתקדם", icon: "📈", description: "הגעת לרמה 5", category: "level" },
  { id: "level_10", name: "מומחה", icon: "🎓", description: "הגעת לרמה 10", category: "level" },

  // Special achievements
  { id: "perfect_day", name: "יום מושלם", icon: "✨", description: "השלמת כל המשימות ביום אחד", category: "special" },
  { id: "early_bird", name: "ציפור מוקדמת", icon: "🐦", description: "השלמת משימות בוקר לפני 8:00", category: "special" },
  { id: "first_purchase", name: "קונה ראשון", icon: "🛒", description: "רכשת פרס ראשון", category: "special" },
];

// Get all achievements for a child
export const getByChild = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const unlockedAchievements = await ctx.db
      .query("achievements")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .collect();

    const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievementId));

    // Return all achievements with unlocked status
    return ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      isUnlocked: unlockedIds.has(def.id),
      unlockedAt: unlockedAchievements.find((a) => a.achievementId === def.id)
        ?.unlockedAt,
    }));
  },
});

// NOTE: getUnlocked was removed as dead code. Use getByChild instead.

// Unlock an achievement
export const unlock = mutation({
  args: {
    childId: v.id("children"),
    achievementId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already unlocked
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_childId_achievementId", (q) =>
        q.eq("childId", args.childId).eq("achievementId", args.achievementId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    // Unlock achievement
    const id = await ctx.db.insert("achievements", {
      childId: args.childId,
      achievementId: args.achievementId,
      unlockedAt: Date.now(),
    });

    // Get achievement definition for notification
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === args.achievementId);
    if (def) {
      await ctx.db.insert("notifications", {
        childId: args.childId,
        type: "achievement",
        title: "הישג חדש!",
        message: `${def.icon} ${def.name}: ${def.description}`,
        relatedId: id,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return id;
  },
});

// Check and unlock achievements based on child stats
export const checkAndUnlock = mutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child) {
      throw new Error("Child not found");
    }

    const unlocked: string[] = [];

    // Task milestones
    if (child.totalTasksCompleted >= 1) {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_childId_achievementId", (q) =>
          q.eq("childId", args.childId).eq("achievementId", "first_task")
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("achievements", {
          childId: args.childId,
          achievementId: "first_task",
          unlockedAt: Date.now(),
        });
        unlocked.push("first_task");
      }
    }

    if (child.totalTasksCompleted >= 10) {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_childId_achievementId", (q) =>
          q.eq("childId", args.childId).eq("achievementId", "tasks_10")
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("achievements", {
          childId: args.childId,
          achievementId: "tasks_10",
          unlockedAt: Date.now(),
        });
        unlocked.push("tasks_10");
      }
    }

    if (child.totalTasksCompleted >= 50) {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_childId_achievementId", (q) =>
          q.eq("childId", args.childId).eq("achievementId", "tasks_50")
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("achievements", {
          childId: args.childId,
          achievementId: "tasks_50",
          unlockedAt: Date.now(),
        });
        unlocked.push("tasks_50");
      }
    }

    if (child.totalTasksCompleted >= 100) {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_childId_achievementId", (q) =>
          q.eq("childId", args.childId).eq("achievementId", "tasks_100")
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("achievements", {
          childId: args.childId,
          achievementId: "tasks_100",
          unlockedAt: Date.now(),
        });
        unlocked.push("tasks_100");
      }
    }

    // Streak achievements
    if (child.currentStreak >= 3) {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_childId_achievementId", (q) =>
          q.eq("childId", args.childId).eq("achievementId", "streak_3")
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("achievements", {
          childId: args.childId,
          achievementId: "streak_3",
          unlockedAt: Date.now(),
        });
        unlocked.push("streak_3");
      }
    }

    if (child.currentStreak >= 7) {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_childId_achievementId", (q) =>
          q.eq("childId", args.childId).eq("achievementId", "streak_7")
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("achievements", {
          childId: args.childId,
          achievementId: "streak_7",
          unlockedAt: Date.now(),
        });
        unlocked.push("streak_7");
      }
    }

    // Create notifications for new achievements
    for (const achievementId of unlocked) {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achievementId);
      if (def) {
        await ctx.db.insert("notifications", {
          childId: args.childId,
          type: "achievement",
          title: "הישג חדש!",
          message: `${def.icon} ${def.name}`,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return unlocked;
  },
});

// Internal version of checkAndUnlock (called from completeTask via scheduler)
export const checkAndUnlockInternal = internalMutation({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child) {
      return [];
    }

    const unlocked: string[] = [];

    // Helper to check and unlock a single achievement
    const tryUnlock = async (achievementId: string) => {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_childId_achievementId", (q) =>
          q.eq("childId", args.childId).eq("achievementId", achievementId)
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("achievements", {
          childId: args.childId,
          achievementId,
          unlockedAt: Date.now(),
        });
        unlocked.push(achievementId);
      }
    };

    // Task milestones
    if (child.totalTasksCompleted >= 1) await tryUnlock("first_task");
    if (child.totalTasksCompleted >= 10) await tryUnlock("tasks_10");
    if (child.totalTasksCompleted >= 50) await tryUnlock("tasks_50");
    if (child.totalTasksCompleted >= 100) await tryUnlock("tasks_100");
    if (child.totalTasksCompleted >= 500) await tryUnlock("tasks_500");

    // Streak achievements
    if (child.currentStreak >= 3) await tryUnlock("streak_3");
    if (child.currentStreak >= 7) await tryUnlock("streak_7");
    if (child.currentStreak >= 14) await tryUnlock("streak_14");
    if (child.currentStreak >= 30) await tryUnlock("streak_30");

    // Points achievements
    if (child.totalPoints >= 100) await tryUnlock("points_100");
    if (child.totalPoints >= 500) await tryUnlock("points_500");
    if (child.totalPoints >= 1000) await tryUnlock("points_1000");

    // Level achievements (XP-based: 100 XP per level)
    const level = Math.floor(child.xp / 100) + 1;
    if (level >= 5) await tryUnlock("level_5");
    if (level >= 10) await tryUnlock("level_10");

    // Create notifications for new achievements
    for (const achievementId of unlocked) {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achievementId);
      if (def) {
        await ctx.db.insert("notifications", {
          childId: args.childId,
          type: "achievement",
          title: "הישג חדש!",
          message: `${def.icon} ${def.name}: ${def.description}`,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return unlocked;
  },
});

// Get achievement count
export const getCount = query({
  args: { childId: v.id("children") },
  handler: async (ctx, args) => {
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_childId", (q) => q.eq("childId", args.childId))
      .collect();

    return {
      unlocked: achievements.length,
      total: ACHIEVEMENT_DEFINITIONS.length,
    };
  },
});
