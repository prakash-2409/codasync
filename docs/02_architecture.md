# SYSTEM ARCHITECTURE

## Tech Stack
*   **Database:** MongoDB (Mongoose) with in-memory Mongo fallback for offline development
*   **Backend:** Node.js, Express.js
*   **Frontend:** React 19 (Vite), Tailwind CSS v3, Axios, Lucide Icons
*   **Authentication & Security:** Clerk (`@clerk/clerk-react` on frontend, `@clerk/clerk-sdk-node` on backend)
*   **Data Fetching:** Axios, Node-cron (automated 12-hour background scheduler)

## Ingestion Pipeline & Background Workers
*   **CLIST Service:** `backend/services/clistService.js` fetches upcoming contests via CLIST API v4 and filters strictly for major competitive platforms:
    *   LeetCode
    *   CodeChef
    *   Codeforces  
    *   AtCoder
*   **Automated Scheduler:** `backend/services/cronService.js` leverages `node-cron` with schedule `0 */12 * * *` (every 12 hours) and performs duplicate-safe upsert operations using MongoDB `findOneAndUpdate` with composite indexing on `externalId` and `url`.
*   **Manual Injection:** `POST /api/contests/custom` enables placement coordinators/admins to insert private aptitude drills and assessments (e.g., Skillrack, TCS NQT, Cognizant mock drives).
    *   Protected via `adminAuth` middleware (`x-admin-key` header verification).

## Placement Tier Recommendation Engine
**File:** `backend/services/recommendationEngine.js`
Evaluates the student's target tier against active/upcoming database contests and returns a single, prioritized "Next-Best-Action" object:
*   **>10 LPA (Marquee Tier):**
    *   Prioritizes: **Codeforces**, **AtCoder**, and LeetCode Biweekly/Weekly contests.
    *   Curated Fallback: Advanced Dynamic Programming & Graph pattern drills on LeetCode (Striver SDE sheet).
*   **10 LPA (Advanced Tier):**
    *   Prioritizes: **LeetCode** and **CodeChef** Starters.
    *   Curated Fallback: Binary Search & Tree Traversals medium speed drills.
*   **5 LPA (Core Placement Tier):**
    *   Prioritizes: **Skillrack** departmental assessments, **TCS NQT**, and Cognizant mock aptitude drives.
    *   Curated Fallback: 20-question quantitative aptitude & logical reasoning drill on Skillrack.
*   **Scoring Heuristics:** Live contests (+100), imminent starts within 6h (+40), tier recommendation match (+50), and platform priority index (+20 to +60).

## Authentication & Security Architecture (Clerk)
*   **Frontend Auth Integration:**
    *   Application wrapped in `<ClerkProvider>` in `frontend/src/App.jsx`.
    *   `<FocusLayout>` displays the `<UserButton />` and user identity when signed in.
    *   Unauthenticated state renders `<SignIn />` and `<SignUp />` styled with custom `clerkAppearance` matching Sienna OS's `parchment` and `warm-brown` editorial palette.
    *   `AuthBridge` component dynamically links Clerk's `getToken()` to Axios via `setAuthTokenGetter()`, injecting Bearer JWT headers on every API request.
*   **Backend JWT Verification & Auto-Provisioning:**
    *   `backend/middleware/requireAuth.js` validates incoming Clerk JWT Bearer tokens using `@clerk/clerk-sdk-node`.
    *   **Auto-Onboarding:** When a student authenticates for the first time, the middleware automatically provisions a MongoDB `User` document linking their `clerkId`, verified institutional/personal Gmail address, and student name.
    *   Attaches `req.user` (Mongoose document) and `req.auth` (Clerk claims) to incoming requests.

## Smart Routing & Telemetry Middleware
All external contest/aptitude links are wrapped by our backend to track engagement silently.
*   **Endpoint:** `/api/redirect?targetUrl=<encoded_url>&contestId=<id>&userId=<uid>`
*   **Logic:** Logs the click timestamp and User ID in MongoDB `engagementLogs` and `ActivityLog`, increments daily activity streaks, and performs a 302 redirect to the target URL.

## Frontend Architecture & Editorial Design System
*   **App Shell:** `frontend/src/components/FocusLayout.jsx` establishes a distraction-free environment omitting traditional dense sidebars and multi-column feeds.
*   **Next-Best-Action Hero:** `frontend/src/App.jsx` renders a single high-priority card displaying platform badge, category, urgency countdown, and tier alignment rationale.
*   **Gamified Heatmap:** `frontend/src/components/ConsistencyHeatmap.jsx` renders a GitHub-style 90-day proof-of-work matrix directly beneath the Next-Best-Action card:
    *   `Level 0` (0 actions): `bg-parchment-200`
    *   `Level 1` (1 action): `bg-sienna-200`
    *   `Level 2` (2 actions): `bg-sienna-400`
    *   `Level 3` (3+ actions): `bg-sienna-600`
    *   Interactive hover inspection, total 90-day engagement count, active day rate (%), and current streak telemetry.
*   **Editorial Theme Tokens (`tailwind.config.js`):**
    *   `parchment`: `#FBF9F5` (base background), `#F8F5EE` (card surface), `#F3EFE6` (secondary surface), `#E8E0D2` (divider border).
    *   `warm-brown`: `#2E2524` (deep text/structural contrast), `#4A3E3D` (borders/muted headings), `#675751` (subtle captions).
    *   `sienna`: `#A0522D` (signature burnt orange), `#C85A17` (active actions & urgency), `#E2725B` (terracotta highlights & countdowns).
*   **API Client Layer:** `frontend/src/services/api.js` provides centralized Axios services for user profile, consistency heatmap, next-best-action retrieval, manual contest injection, and smart redirect generation.

## Core API Endpoints
*   `GET /api/health` - Server healthcheck and status.
*   `GET /api/contests` - Fetch filtered active/upcoming contests (Public).
*   `GET /api/contests/next-best-action` - Single-threaded tier-tailored recommendation (supports `?tier=5LPA`).
*   `POST /api/contests/custom` - Secure manual test injection (Admin protected).
*   `GET /api/redirect` - Telemetry logging, streak incrementation, and outbound redirection.
*   `GET /api/users/profile` - User profile, current streak, target tier, and engagement logs (Protected: `requireAuth`).
*   `PATCH /api/users/tier` - Update target tier (Protected: `requireAuth`).
*   `GET /api/users/heatmap` - 90-day consistency heatmap telemetry array (Protected: `requireAuth`).

## Core Database Schemas (Mongoose)
**1. User Schema**
*   `clerkId`: String (Unique, sparse index)
*   `email`, `registerNumber`, `name`, `avatarUrl`
*   `activityStreak` (Number)
*   `engagementLogs`: Array of `{ contestId, targetUrl, clickedAt }`
*   `targetTier`: String ('5LPA', '10LPA', '10+LPA')

**2. Contest/Event Schema**
*   `title`, `platform` (LeetCode, CodeChef, Codeforces, AtCoder, Skillrack, TCS NQT)
*   `url` (Direct registration link)
*   `startTime`, `duration`, `endTime`
*   `category` ('Coding', 'Aptitude', 'Hackathon', 'Certification')
*   `externalId` (String, unique sparse index)
*   `isVerified` (Boolean)
*   `tierRecommendation` (Array of Strings: '5LPA', '10LPA', '10+LPA')