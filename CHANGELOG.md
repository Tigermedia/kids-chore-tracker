# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
