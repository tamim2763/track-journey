# Track The Journey

A comprehensive academic progress tracker designed for HSC (Higher Secondary Certificate) and university admission aspirants in Bangladesh. Track chapterwise study progress, record exam scores, monitor readiness across all 8 papers, and synchronize data with Google Sheets — all from a single, responsive web application.

**Live Application:** [https://trackadmissionprogress.app](https://trackadmissionprogress.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Google Sheets Synchronization](#google-sheets-synchronization)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Preparing for university admission exams in Bangladesh requires structured study across four subjects, each with two papers — a total of eight papers spanning Physics, Chemistry, Higher Mathematics, and Biology. **Track The Journey** provides a centralized dashboard to monitor chapter-level progress for every paper, record and average exam scores, plan weekly study targets, and countdown to upcoming admission exams.

All data is persisted locally in the browser via `localStorage`, ensuring zero-cost operation with no backend or database dependency. For students who want cloud backup, optional two-way Google Sheets synchronization is available through Firebase Authentication.

---

## Features

### Chapter Progress Tracker
- Track all chapters across 8 papers: Physics (1st & 2nd), Chemistry (1st & 2nd), Higher Mathematics (1st & 2nd), and Biology (1st & 2nd)
- Chapter status management: Not Started, In Progress, Completed, Revision
- Mark chapters as current weekly focus for targeted study planning

### Exam Score Management
- Record three exam scores per chapter with obtained/total mark entry
- Automatic percentage calculation and averaging across attempts
- Visual score indicators and performance grading
- Filter chapters by performance: strong (75%+) and weak (below 75%)

### Analytics and Visualization
- Interactive bar charts showing exam performance across chapters (powered by Recharts)
- Radar charts for cross-paper readiness comparison
- Line charts for tracking score trends over multiple exams
- Toggle between single-paper and all-paper overview modes
- Aggregate readiness rate calculated across all 8 papers

### Exam Countdown Timers
- Live countdown timers with real-time second-level updates for upcoming admission exams
- Pre-configured countdowns for major exams: BUET, DU, Medical, CUET, RUET, KUET, and more
- Support for custom exam entries with name, date, category, and venue
- Pin important exams to the top of the list
- Categorized by type: Engineering, University, Medical, Model Test

### Google Sheets Synchronization
- Two-way sync: push local data to Google Sheets and pull updates back
- Creates a formatted spreadsheet with 8 dedicated sheet tabs
- Search and select from existing spreadsheets in Google Drive
- Bidirectional data flow preserves scores, status, and notes

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |
| Authentication | Firebase Auth (Google OAuth) |
| Cloud Sync | Google Sheets API v4, Google Drive API v3 |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions |

---

## Project Structure

```
track-journey/
├── index.html                        # Application entry point
├── vite.config.ts                    # Vite build configuration
├── firebase.json                     # Firebase Hosting configuration
├── firebase-applet-config.json       # Firebase project credentials
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── src/
│   ├── main.tsx                      # React DOM render entry
│   ├── App.tsx                       # Root component and state management
│   ├── types.ts                      # TypeScript type definitions
│   ├── index.css                     # Global styles and Tailwind directives
│   ├── components/
│   │   ├── Navbar.tsx                # Navigation bar with subject/paper tabs
│   │   ├── ChapterTable.tsx          # Chapter progress table with search and filters
│   │   ├── ExamScoreModal.tsx        # Modal for entering exam scores
│   │   ├── ProgressCharts.tsx        # Analytics charts (bar, radar, line)
│   │   ├── CountdownWidget.tsx       # Admission exam countdown timers
│   │   └── SyncModal.tsx             # Google Sheets sync manager
│   └── services/
│       ├── firebaseAuth.ts           # Firebase Authentication setup
│       ├── googleSheets.ts           # Google Sheets and Drive API integration
│       └── initialData.ts           # Default chapter and exam data
├── public/
│   └── assets/                       # Static assets
└── .github/
    └── workflows/
        ├── firebase-hosting-merge.yml        # Auto-deploy on push to main
        └── firebase-hosting-pull-request.yml # Preview deploy on PR
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/tamim2763/track-journey.git
   cd track-journey
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the application at [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server on port 3000 |
| `npm run build` | Build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove build artifacts |

---

## Google Sheets Synchronization

The application supports optional cloud synchronization through Google Sheets. This feature requires Google Sign-In and uses the following OAuth scopes:

- `spreadsheets` — Read and write spreadsheet data
- `drive.file` — Create and access spreadsheets created by the app
- `drive.readonly` — List existing spreadsheets for selection

### How It Works

1. Sign in with your Google account through the Sync Manager modal.
2. Create a new spreadsheet or link an existing one from Google Drive.
3. The application creates 8 sheet tabs (one per paper) with formatted headers, merged cells, and column sizing.
4. Push local progress to the spreadsheet or pull remote changes back to the browser.

All synchronization is performed client-side using the Google Sheets API v4 and Google Drive API v3. No data passes through any intermediary server.

---

## Deployment

The application is deployed to Firebase Hosting with automated CI/CD via GitHub Actions.

- **Push to `main`:** Triggers an automatic production deployment.
- **Pull Requests:** Generate preview deployments for review.

### Manual Deployment

```bash
npm run build
firebase deploy --only hosting
```

---

## License

This project is licensed under the Apache License 2.0. See the source file headers for details.
