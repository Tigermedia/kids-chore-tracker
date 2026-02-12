# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-02-12

### Added

- **Parent Reward Redemption (מימוש פרס לילד)**: Parents can now redeem rewards for children proactively
  - New "🎁 ממש לילד" button on each reward card in the parent rewards page
  - Modal lets parent select one or multiple children at once
  - Shows each child's current point balance with color-coded sufficiency indicator
  - Deducts points per child, creates purchase record (auto-marked as redeemed), sends in-app notification
  - Handles insufficient points gracefully per child with clear error messages

### Fixed

- **"כל הכבוד" celebration message** now properly centered on mobile (was offset to the left in RTL layout)
- **Convex deployment sync** - redeployed functions to correct production deployment (`befitting-crane-482`)
- **Convex URL mismatch** - both `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` now correctly point to `befitting-crane-482.convex.cloud`

## [1.5.0] - 2026-02-06

### Added

- **Parent Add Points (הוספת נקודות)**: New `/parent/add-points` page for bonus points
- **Audio Notifications**: TTS notifications for point changes
- **40+ Achievements**: Expanded from 17 to 40+ unlockable achievements
- **"הוספת נקודות" in navigation menu**: Added to parent top nav bar

### Fixed

- Bug: `patch` called inside Convex query (not mutation) in `tasks.ts`
- Removed 100-point cap on point inputs
- Added task frequency option for special tasks (once/daily/weekly/monthly)

## [1.4.0] - 2026-02-03

### Added

- **Audio Playback for Tasks (הקראת משימות)**: For kids who can't read yet
  - 🔊 speaker button next to each task name in the child dashboard
  - Tapping the button reads the task name aloud using the Web Speech API in Hebrew (`he-IL`)
  - Pulse animation visual feedback while audio is playing
  - Button uses `stopPropagation()` to avoid triggering task completion toggle

- **Account Sharing (שיתוף חשבון)**: Invite another parent to share your family account
  - New `familyInvites` table in schema for tracking invite state
  - Backend: `inviteParent`, `getPendingInvites`, `getMyInvites`, `acceptInvite`, `declineInvite`, `cancelInvite`, `removeFamilyMember`, `getFamilyMembers` in `convex/families.ts`
  - Settings page: new "שיתוף חשבון" section showing family members, pending invites, and invite form
  - Settings page: "הזמנות שהתקבלו" section for users who received invites
  - Owner can remove non-owner members from the family
  - When an invited user accepts, their empty auto-created family is cleaned up
  - Removed members automatically get a new empty family so they aren't locked out

## [1.3.0] - 2026-02-01

### Added

- **Child Profile Isolation**: Each child now sees only their own profile and data
  - New `ChildContext` provider manages selected child state across all dashboard pages
  - `ChildSelectScreen` component for choosing which child to enter as
  - Dashboard, tasks, shop, achievements, and reports all scoped to selected child
  - Parent PIN required to switch between children (prevents kids peeking at siblings)
- **Multi-Child Task Assignment**: When adding a new task in parent mode, select multiple children at once
  - Child selector chips with color-coded avatars
  - Pre-selects currently viewed child
  - Tasks created in parallel for all selected children
  - Only appears when family has 2+ children

### Fixed

- **Parent PIN Always Required**: Entering the child dashboard now clears the parent mode session
  - Previously, kids could access parent mode without PIN if the parent had been active within 15 minutes
  - Now switching from child dashboard to parent mode always requires PIN entry

### Changed

- Dashboard layout refactored to use `ChildProvider` wrapper
- All dashboard sub-pages simplified to use `useChild()` hook instead of local state
- Task modal updated with child assignment UI for new tasks

## [1.2.0] - 2026-01-13

### Added

- **Weekly Challenges (אתגרים שבועיים)**: Rotating weekly challenges for each child
  - 5 challenge types: morning tasks, consecutive days, weekly points, evening completions, total tasks
  - Auto-initializes on dashboard load, rotates to avoid repeating recent types
  - Progress bar with live computation from actual task completions
  - Claim button with celebration animation when challenge is met
  - Shimmer effect on completable challenges, green checkmark when claimed
  - Backend: `convex/challenges.ts` with `getActiveChallenge`, `getChallengeProgress`, `initializeWeeklyChallenge`, `claimChallengeReward`
- **Daily Reward / Daily Spin (פרס יומי)**: Daily reward system with spin animation
  - Random 1-10 points per claim, with 5% chance of 25-point jackpot
  - Bouncing/glowing gift icon when unclaimed
  - Spin/reveal animation with number cycling effect
  - Confetti celebration on claiming
  - Countdown timer to midnight when already claimed
  - Daily streak tracking across consecutive days
  - Backend: `convex/dailyRewards.ts` with `getDailyReward`, `claimDailyReward`, `getDailyRewardHistory`
- **Database**: Added `dailyRewardClaims` table for reward claim history
- **Components**: `WeeklyChallengeCard` and `DailyRewardCard` dashboard components

## [1.1.3] - 2026-01-02

### Changed

- **Welcome Page Redesign**: New modern glassmorphism design with animated gradient mesh background
- Floating emoji animations and glass-panel cards
- Improved visual hierarchy with benefit cards featuring icons
- Updated color scheme with warm orange tones

## [1.1.2] - 2026-01-01

### Added

- **Editable Account Info**: Name and family name can now be edited in parent settings
- **Parent Dashboard Cards**: Added "דוחות" (Reports) and "הגדרות" (Settings) quick action cards

### Changed

- **Settings Page**: Account info fields now have edit buttons with inline editing

## [1.1.1] - 2026-01-01

### Changed

- **App Rebranding**: Renamed app from "משימות ילדים" to "כוכבים" (Stars)
- Updated all title references across welcome page, dashboard, and PWA manifest
- Added version number to welcome page footer

### Fixed

- **Default Rewards**: Fixed rewards not showing in shop - rewards now auto-initialize when family is created
- **Clerk UserButton**: Removed Clerk management icon from dashboard header

## [1.1.0] - 2026-01-01

### Added

- **Parent PIN Protection**: 4-digit PIN code to protect parent area with 15-minute session timeout
- **Mobile Parent Access**: Added "הורה" (Parent) button to mobile bottom navigation
- **PWA Support**: Progressive Web App capability for mobile installation with manifest.json and app icon
- **Celebration Animation**: Confetti animation with emoji burst when completing tasks
- **Task Management Page (Parent)**: Full CRUD interface for managing morning, evening, and special tasks
- **Settings Page (Parent)**: New settings page with account info, PIN management, and sign out

### Changed

- Removed "Add Child" from dashboard - now only available in parent area
- Replaced reports link with parent link in mobile navigation
- Removed Clerk UserButton from parent header (settings now in dedicated page)
- Dashboard auto-redirects to parent area when no children exist

### Security

- PIN codes are hashed before storage
- Parent session expires after 15 minutes of inactivity with activity tracking

## [1.0.2] - 2026-01-01

### Fixed
- Add child button not working - ensureUser now called before createChild
- Silent failures when adding child - added error handling with visual feedback
- Loading state shown while creating child ("מוסיף...")
- Error messages displayed in Hebrew when child creation fails

### Changed
- Both dashboard and parent children pages now call ensureUser before creating child
- Cancel buttons disabled during child creation to prevent race conditions

## [1.0.1] - 2026-01-01

### Added
- Notification bell with dropdown showing unread notifications
- Notification count badge on bell icon
- Mark individual notifications as read
- Mark all notifications as read
- Extended avatar selection with 30+ emojis:
  - Superhero emojis (🦸, 🦸‍♂️, 🦸‍♀️, 🦹, 🦹‍♂️, 🦹‍♀️, 🥷)
  - Horse and additional animals (🐴, 🐯, 🐰, 🐨)
  - Princess/prince and magical characters (👸, 🤴, 🧙, 🧚)

### Changed
- Child theme colors now apply to UI elements:
  - Child selector buttons use child's theme color
  - Points card has colored border matching theme
  - Level progress bar uses child's theme color
  - Tasks button uses child's theme color

## [1.0.0] - 2026-01-01

### Added
- Initial release of Kids Chore Tracker app
- Next.js 14 with App Router
- Convex database integration
- Clerk authentication with Google/Facebook OAuth
- Hebrew localization for Clerk
- Parent dashboard with:
  - Children overview and stats
  - Point reduction feature with image upload
  - In-app notifications for children
- Child dashboard with:
  - Points, XP, level, and streak display
  - Child selector for multiple children
  - Add child functionality with avatar selection
  - 10-tier level system with icons
- Database schema for:
  - Users, families, family members
  - Children profiles with stats
  - Task templates and completions
  - Achievements, rewards, purchases
  - Notifications, point reductions
  - Weekly challenges, daily rewards

### Fixed
- Added ensureUser mutation fallback when Clerk webhook doesn't trigger
- Hebrew placeholders for Clerk forms
- Route conflicts resolved (dashboard, parent subdirectories)

### Known Issues
- Missing pages: /dashboard/tasks, /dashboard/shop, /dashboard/achievements, /dashboard/reports
- Missing pages: /parent/children, /parent/rewards, /parent/reports
- Clerk in development mode (requires custom domain for production)
