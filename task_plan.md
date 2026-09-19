---
description: "Cross-Platform Smart Microlearning & History Stash App (Vertical feed with optional local AI summarization)"
---

# Project Master Plan: Smart Stash App

## Phase 1: Project Scaffolding & Architecture Setup
- [ ] Initialize cross-platform project structure using Flutter (or React Native based on preference).
- [ ] Configure local storage database (`Hive` or `SQLite`) for offline card persistence.
- [ ] Establish directory architecture:
  - `/models` (Card schema data structures)
  - `/views` (Vertical swipeable feed screen)
  - `/services` (RSS/Atom feed parsers and local AI abstraction layer)
  - `/database` (Local persistence logic)

## Phase 2: Core UI - Vertical Swipeable Feed
- [ ] Build a full-screen vertical swipeable layout (`PageView.builder` with `scrollDirection: Axis.vertical`).
- [ ] Design the microlearning card UI component:
  - Immersive dark/light minimal aesthetic taking 100% viewport height.
  - Category badge & bold headline area.
  - Core idea text section optimized for quick 10-second reading.
  - Right-side action bar: Heart/Stash button, Original Source Link icon, and Share button.
- [ ] Hook up local state management so tapping "Stash" instantly saves the card ID locally without lag.

## Phase 3: Content Pipelines (RSS & Open Feeds)
- [ ] Implement an RSS/Atom feed ingestion engine targeting free educational sources:
  - History feeds (e.g., historical archives, Open RSS converters).
  - Microlearning and general knowledge feeds (e.g., Wikipedia featured articles/summaries, science feeds).
- [ ] Build a background synchronization worker to fetch fresh content when connected to Wi-Fi and cache it into the local database for offline reading (e.g., flights).

## Phase 4: Optional On-Device AI Summarization Layer
- [ ] Implement a platform capability checker on app boot:
  - Check device RAM, operating system, and hardware specs.
  - Set a feature flag `enableLocalAI` (True for high-end Android flagship hardware; False for iOS and unsupported mid-range devices).
- [ ] Integrate local text extraction to ingest raw article bodies from URLs.
- [ ] *Conditional Execution:* If `enableLocalAI` is true, pass text blocks through a bundled on-device model engine to auto-generate 2-sentence summaries.
- [ ] *Graceful Fallback:* If false, hide automated AI triggers cleanly, falling back to pre-parsed feed summaries or manual card entry without throwing errors or crashing.

## Phase 5: Testing & Build Verification
- [ ] Verify smooth 60fps+ scrolling behavior across the vertical feed view.
- [ ] Test offline data caching by toggling network off and scrolling through stashed cards.
- [ ] Compile debug build and check platform-specific layout constraints.