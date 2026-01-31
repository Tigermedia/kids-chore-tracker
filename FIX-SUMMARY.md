# Fix Summary — Kids Chore Tracker (כוכבים)

**Date:** 2026-01-31
**Based on:** AUDIT-REPORT.md

---

## CRITICAL Fixes

### 1. Authorization Checks (Security)
**Files:** `convex/lib.ts` (new), `convex/children.ts`, `convex/tasks.ts`

**Problem:** Any authenticated user could access any child's data by passing arbitrary `childId` values. No family ownership verification existed in most queries and mutations.

**Solution:**
- Created `convex/lib.ts` with two reusable auth helpers:
  - `getAuthenticatedFamily(ctx)` — resolves identity → user → familyMember → familyId
  - `verifyChildAccess(ctx, childId)` — verifies child belongs to the requesting user's family
- **children.ts:** Added verification to `getChild`, `updateChild`, `deleteChild`
- **tasks.ts:** Added verification to ALL functions — `getTemplates`, `getTemplatesByTimeOfDay`, `getTodayTasks`, `completeTask`, `uncompleteTask`, `createTemplate`, `updateTemplate`, `deleteTemplate`, `getCompletionHistory`
- For mutations that take a `templateId` or `completionId` (not `childId` directly), the code first resolves the associated `childId` then verifies family ownership

### 2. manifest.json 404 (PWA Broken)
**File:** `src/middleware.ts`

**Problem:** Clerk middleware's route matcher regex `js(?!on)` excluded `.js` files but NOT `.json` files. This caused `/manifest.json` to be intercepted by the auth middleware, which tried to protect it (non-public route), resulting in a redirect/404 for unauthenticated PWA install requests.

**Solution:** Changed `js(?!on)` to `js(on)?` in the matcher regex, so both `.js` and `.json` static files are excluded from middleware processing.

---

## MEDIUM Fixes

### 3. Streak Logic
**File:** `convex/tasks.ts` (in `completeTask` mutation)

**Problem:** `currentStreak` and `longestStreak` fields existed in the schema and were displayed in the UI, but no code ever updated them — they were always 0.

**Solution:** Added streak update logic in `completeTask`:
- On the **first** task completion of a day: checks if there are completions from yesterday
  - If yesterday has completions → `currentStreak + 1` (continues streak)
  - If not → `currentStreak = 1` (starts new streak)
- Subsequent completions on the same day don't change the streak
- `longestStreak` is updated whenever `currentStreak` exceeds it

### 4. Achievement Auto-Check
**Files:** `convex/achievements.ts`, `convex/tasks.ts`

**Problem:** `checkAndUnlock` mutation existed but was never called. Achievements would never unlock automatically.

**Solution:**
- Added `checkAndUnlockInternal` as an `internalMutation` in achievements.ts (cleaner version using a `tryUnlock` helper, checks all milestone types including tasks_500, streak_14, streak_30, all point thresholds, and level thresholds)
- `completeTask` now schedules the achievement check via `ctx.scheduler.runAfter(0, internal.achievements.checkAndUnlockInternal, { childId })`
- The check runs in a separate transaction after the completion is committed, ensuring it sees the latest stats

### 5. App Name in Auth Pages
**Files:** `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

**Problem:** Still showed the old name "משימות ילדים 🌟" from before the v1.1.1 rebranding.

**Solution:** Changed to "כוכבים ✨" in both pages.

---

## LOW Fixes (Cleanup)

### 6. Unused npm Dependencies
**File:** `package.json`

Removed 5 packages that were not imported anywhere:
- `recharts`
- `sonner`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

### 7. Unused Convex Functions
**Files:** `convex/children.ts`, `convex/users.ts`, `convex/achievements.ts`, `convex/rewards.ts`

Removed functions confirmed unused by grep across all source files:
- `children.addXP` — XP is updated directly in `completeTask`
- `children.addPoints` — Points are updated directly in `completeTask`
- `users.getUserByClerkId` — Redundant; `getCurrentUser` resolves from auth identity
- `achievements.getUnlocked` — Not called from frontend; `getByChild` is used instead
- `rewards.initializeDefaultRewards` (public mutation) — Only the internal version (`initializeDefaultRewardsInternal`) is used via `ctx.scheduler`

### 8. Replace Native confirm()
**File:** `src/app/(parent)/parent/tasks/page.tsx`

**Problem:** Task deletion used `window.confirm()` which shows an unstyled browser dialog, inconsistent with the rest of the app.

**Solution:** Replaced with a styled modal dialog matching the app's design language (rounded corners, proper Hebrew text, red delete button, cancel option).

---

## Commits

1. `fix(security): add family ownership verification to all children and tasks queries/mutations`
2. `fix(pwa): fix manifest.json 404 by excluding .json files from Clerk middleware`
3. `feat: add streak logic and achievement auto-check on task completion`
4. `fix(ui): update app name from "משימות ילדים 🌟" to "כוכבים ✨" in auth pages`
5. `chore: remove 5 unused npm dependencies`
6. `chore: remove unused Convex functions (dead code cleanup)`
7. `fix(ui): replace native confirm() with styled delete confirmation modal`

---

## Not Addressed (Out of Scope)

- **Clerk Development Mode** — Requires custom domain setup (infrastructure, not code)
- **Dark Mode** — Large effort, UI-wide changes needed
- **Perfect Day achievement** — Needs additional logic in checkAndUnlock
- **Service Worker** — Enhances PWA but not critical
- **Empty schema tables** (dailyStats, challenges, dailyRewards) — Left for future features
- **PIN rate limiting** — Low priority, would need schema changes
- **Notification child sync** — Layout-level selectedChildId sync issue
