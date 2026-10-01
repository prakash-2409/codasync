# SYSTEM ARCHITECTURE

## Tech Stack
*   **Database:** MongoDB (Mongoose) with in-memory Mongo fallback for offline development
*   **Backend:** Node.js, Express.js
*   **Frontend:** React, Tailwind CSS (Custom configured for warm/sienna palette)
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

## Smart Routing Middleware
All external contest/aptitude links are wrapped by our backend to track engagement silently.
*   **Endpoint:** `/api/redirect?targetUrl=<encoded_url>&contestId=<id>`
*   **Logic:** Logs the click timestamp and User ID in MongoDB, increments activity streaks, and performs a 302 redirect to the target URL.

## Core API Endpoints
*   `GET /api/health` - Server healthcheck and status.
*   `GET /api/contests` - Fetch filtered active/upcoming contests.
*   `GET /api/contests/next-best-action` - Single-threaded tier-tailored recommendation.
*   `POST /api/contests/custom` - Secure manual test injection (Admin protected).
*   `GET /api/redirect` - Telemetry logging and outbound redirection.
*   `GET /api/users/profile` - User profile, current streak, target tier, and engagement stats.
*   `GET /api/users/heatmap` - 365-day consistency heatmap telemetry array.

## Core Database Schemas (Mongoose)
**1. User Schema**
*   `email`, `registerNumber`, `name`
*   `activityStreak` (Number)
*   `engagementLogs`: Array of `{ contestId, clickedAt }`
*   `targetTier`: String ('5LPA', '10LPA', '10+LPA')

**2. Contest/Event Schema**
*   `title`, `platform` (LeetCode, CodeChef, Codeforces, AtCoder, Skillrack, TCS NQT)
*   `url` (Direct registration link)
*   `startTime`, `duration`, `endTime`
*   `category` ('Coding', 'Aptitude', 'Hackathon', 'Certification')
*   `externalId` (String, unique sparse index)
*   `isVerified` (Boolean)
*   `tierRecommendation` (Array of Strings: '5LPA', '10LPA', '10+LPA')