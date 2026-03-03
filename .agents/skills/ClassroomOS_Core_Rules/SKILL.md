---
name: ClassroomOS Core Development Rules
description: Non-negotiable rules for developing and modifying ClassroomOS. Must be followed at all times.
---

# ClassroomOS Core Rules

As an AI agent or developer contributing to ClassroomOS, you must strictly adhere to these rules:

## 1. Communication Protocol (Pre & Post Task)
- **Before starting work**: Always explain what the feature or change will affect and why it is being done, outlining the system's "blast radius."
- **After finishing work**: Always report exactly what was completed to provide clear context for developers and future iterations.

## 2. Data Persistence & Backup (Local-First)
- You MUST ensure any new state or feature that requires saving uses `localStorage` or `IndexedDB`.
- Global settings must be synced with `backupService.js` (or Data Center) to ensure one-click import/export functionality.

## 3. Privacy & Google Drive Scope (drive.file)
- ClassroomOS is Serverless and relies on the user's personal Google Drive (BYOD).
- **CRITICAL**: Never request broad Google Drive permissions. You must strictly limit API calls to the `drive.file` scope (only files created by the app). 
- Avoid any cross-user collaborative features that would require elevated permissions unless strictly directed.

## 4. Documentation & Versioning Sync
- Upon completing a feature or making significant logic changes, you MUST update `ARCHITECTURE.md` (if structural changes occurred).
- You MUST update `src/utils/patchNotesData.js` (keeping it pruned to the active/latest versions) and append the full history to `CHANGELOG_ARCHIVE.md`.

## 5. UI/UX Consistency (Light & Dark Mode)
- Maintain visual consistency across the entire app.
- Every new component must utilize the centralized `UI_THEME` object.
- Every new component must perfectly support both Light and Dark modes (`dark:` Tailwind variants).
- Prioritize glassmorphic, modern, and clean UI aesthetics. 

## 6. Accessibility & Student-Facing Views (Zhuyin & Zoom)
- Any view intended for students or parents MUST support `ZhuyinRenderer` for phonetic ruby characters.
- Long-form text content MUST integrate the cross-device zooming classes (`uiZoom`).

## 7. Performance & Component Modularity
- Do not create Monolithic Components. Split files exceeding 400 lines into smaller sub-components (Views, Components, Utils).
- Avoid excessive Re-renders. Use `Zustand` for complex states, avoid storing massive arrays in top-level Contexts, and use Debouncing for high-frequency user inputs.

## 8. Offline Tolerance & Error Handling
- Never assume a perfect network connection. 
- All API requests (especially Google Drive) must be wrapped in `try...catch`.
- Implement graceful degradation (e.g., fallback to IndexedDB drafts if a save process fails).
