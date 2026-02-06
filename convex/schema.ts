import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (Parents) - synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  // Families - group parents and children
  families: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    parentPin: v.optional(v.string()), // Hashed 4-digit PIN for parent area
    createdAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),

  // Family Members - link users to families
  familyMembers: defineTable({
    familyId: v.id("families"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("parent"),
      v.literal("viewer")
    ),
    joinedAt: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_userId", ["userId"]),

  // Children Profiles
  children: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    avatar: v.string(),
    theme: v.string(),
    xp: v.number(),
    createdAt: v.number(),
    // Stats (denormalized for quick access)
    totalPoints: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    totalTasksCompleted: v.number(),
  }).index("by_familyId", ["familyId"]),

  // Task Templates (reusable task definitions)
  taskTemplates: defineTable({
    childId: v.id("children"),
    name: v.string(),
    icon: v.string(),
    points: v.number(),
    timeOfDay: v.union(
      v.literal("morning"),
      v.literal("evening"),
      v.literal("special")
    ),
    hasTimer: v.boolean(),
    timerMinutes: v.optional(v.number()),
    requiresPhoto: v.boolean(),
    isActive: v.boolean(),
    isOneTime: v.boolean(),
    frequency: v.optional(v.union(
      v.literal("once"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    )),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_childId", ["childId"])
    .index("by_childId_timeOfDay", ["childId", "timeOfDay"]),

  // Task Completions (daily instances)
  taskCompletions: defineTable({
    childId: v.id("children"),
    taskTemplateId: v.id("taskTemplates"),
    date: v.string(), // YYYY-MM-DD format
    completedAt: v.number(),
    points: v.number(),
    photoStorageId: v.optional(v.id("_storage")),
  })
    .index("by_childId", ["childId"])
    .index("by_childId_date", ["childId", "date"])
    .index("by_taskTemplateId", ["taskTemplateId"]),

  // Daily Stats (aggregated per day)
  dailyStats: defineTable({
    childId: v.id("children"),
    date: v.string(), // YYYY-MM-DD
    tasksCompleted: v.number(),
    pointsEarned: v.number(),
    isPerfectDay: v.boolean(),
  })
    .index("by_childId", ["childId"])
    .index("by_childId_date", ["childId", "date"]),

  // Achievements
  achievements: defineTable({
    childId: v.id("children"),
    achievementId: v.string(), // e.g., "first_task", "streak_3"
    unlockedAt: v.number(),
  })
    .index("by_childId", ["childId"])
    .index("by_childId_achievementId", ["childId", "achievementId"]),

  // Rewards (Shop Items)
  rewards: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    icon: v.string(),
    description: v.string(),
    cost: v.number(),
    isActive: v.boolean(),
    isDefault: v.boolean(),
    createdAt: v.number(),
  }).index("by_familyId", ["familyId"]),

  // Purchase History
  purchases: defineTable({
    childId: v.id("children"),
    rewardId: v.id("rewards"),
    cost: v.number(),
    purchasedAt: v.number(),
    isRedeemed: v.boolean(),
    redeemedAt: v.optional(v.number()),
  })
    .index("by_childId", ["childId"])
    .index("by_rewardId", ["rewardId"]),

  // Weekly Challenges
  challenges: defineTable({
    childId: v.id("children"),
    weekStart: v.string(), // YYYY-MM-DD (Monday)
    challengeType: v.string(), // "tasks", "streak", "points", "perfect"
    name: v.string(),
    icon: v.string(),
    target: v.number(),
    reward: v.number(),
    progress: v.number(),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
  })
    .index("by_childId", ["childId"])
    .index("by_childId_weekStart", ["childId", "weekStart"]),

  // Daily Login Rewards (tracker - one per child)
  dailyRewards: defineTable({
    childId: v.id("children"),
    lastClaimDate: v.string(), // YYYY-MM-DD
    streak: v.number(),
  }).index("by_childId", ["childId"]),

  // Daily Reward Claims (history of individual claims)
  dailyRewardClaims: defineTable({
    childId: v.id("children"),
    date: v.string(), // YYYY-MM-DD
    pointsAwarded: v.number(),
    isJackpot: v.boolean(),
    claimedAt: v.number(),
  })
    .index("by_childId", ["childId"])
    .index("by_childId_date", ["childId", "date"]),

  // Point Reductions (Parent penalty system)
  pointReductions: defineTable({
    childId: v.id("children"),
    parentId: v.id("users"),
    points: v.number(),
    reason: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    isAcknowledged: v.boolean(),
    acknowledgedAt: v.optional(v.number()),
  })
    .index("by_childId", ["childId"])
    .index("by_parentId", ["parentId"])
    .index("by_childId_acknowledged", ["childId", "isAcknowledged"]),

  // Point Additions (Parent bonus system)
  pointAdditions: defineTable({
    childId: v.id("children"),
    parentId: v.id("users"),
    points: v.number(),
    reason: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    isAcknowledged: v.boolean(),
    acknowledgedAt: v.optional(v.number()),
  })
    .index("by_childId", ["childId"])
    .index("by_parentId", ["parentId"])
    .index("by_childId_acknowledged", ["childId", "isAcknowledged"]),

  // Family Invites (account sharing)
  familyInvites: defineTable({
    familyId: v.id("families"),
    invitedEmail: v.string(),
    invitedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_familyId", ["familyId"])
    .index("by_invitedEmail", ["invitedEmail"]),

  // In-App Notifications
  notifications: defineTable({
    childId: v.id("children"),
    type: v.union(
      v.literal("point_reduction"),
      v.literal("point_addition"),
      v.literal("achievement"),
      v.literal("level_up"),
      v.literal("challenge_complete"),
      v.literal("reward_available"),
      v.literal("streak_reminder")
    ),
    title: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_childId", ["childId"])
    .index("by_childId_isRead", ["childId", "isRead"])
    .index("by_childId_type", ["childId", "type"]),
});
