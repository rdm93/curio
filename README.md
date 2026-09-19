# Curio ⚡️

A cross-platform smart microlearning and knowledge stash app built with React Native, Expo, and TypeScript. Curio delivers bite-sized, high-retention insights across history, science, philosophy, and mental models through an intuitive vertical card feed—designed for deep curiosity without algorithmic distraction.

---

## Features

- **Vertical Card Feed**: Full-screen vertical swipe experience designed for quick, 10–30 second learning bursts.
- **Offline-First Storage**: Powered by local SQLite (`expo-sqlite`) for instant loading and full offline capability (e.g., in airplane mode).
- **Curated & Dynamic Feeds**:
  - Pre-seeded with 50+ rich educational cards across multiple categories.
  - Automated feed ingestion from open knowledge sources: **Wikipedia "On This Day"** historical archives and **NASA Science & Astronomy** RSS feeds.
- **On-Device AI Summarization**:
  - **Hardware Probe**: Automatically detects platform capability and assigns local execution tiers.
  - **Extractive NLP Engine**: Processes long-form articles into concise summaries and key takeaways entirely on-device with zero API latency and no external cloud dependencies.
- **Personal Knowledge Stash**:
  - Instant one-tap bookmarking with haptic feedback.
  - Full-text search and category filtering across stashed items.
- **Deep-Dive Reader**: Slide-up modal sheet with complete historical context, citations, and original source links.

---

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 57)
- **Language**: TypeScript
- **Database**: `expo-sqlite`
- **Feed Parsing**: `fast-xml-parser`
- **UI / Interactions**: `expo-linear-gradient`, `expo-haptics`, `expo-sharing`, `@expo/vector-icons`
- **Testing**: Node.js test runner with `tsx`

---

## Project Structure

```text
curio/
├── assets/                  # App icons and splash screens
├── src/
│   ├── assets/seed/         # Pre-bundled offline learning cards
│   ├── components/          # Reusable UI components (Cards, Badges, Modals)
│   ├── database/            # SQLite database service & queries
│   ├── screens/             # FeedScreen & StashScreen
│   ├── services/            # Feed ingestion, on-device NLP, hardware probe
│   ├── types/               # TypeScript data models and interfaces
│   └── utils/               # Platform-specific utilities
├── tests/                   # Automated unit & integration tests
├── App.tsx                  # App root with navigation & state binding
├── app.json                 # Expo project configuration
└── package.json             # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on your physical mobile device, or an iOS / Android simulator

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:rdm93/curio.git
   cd curio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the Expo development server:

```bash
npm start
```

From the terminal UI, you can:
- Press `a` to open in an **Android emulator**
- Press `i` to open in an **iOS simulator**
- Press `w` to open in a **web browser**
- Scan the displayed QR code with **Expo Go** on physical device

### Running Tests

Execute the automated test suite:

```bash
npm test
```

---

## License

This project is licensed under the [MIT License](LICENSE).
