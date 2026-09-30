# SYSTEM ARCHITECTURE

## Tech Stack
*   **Database:** MongoDB (Mongoose)
*   **Backend:** Node.js, Express.js
*   **Frontend:** React, Tailwind CSS (Custom configured for warm/sienna palette)
*   **Data Fetching:** Axios, Node-cron (for automated CLIST API ingestion)

## Smart Routing Middleware
All external contest/aptitude links are wrapped by our backend to track engagement silently.
*   **Endpoint:** `/api/redirect?targetUrl=<encoded_url>&contestId=<id>`
*   **Logic:** Logs the click timestamp and User ID in MongoDB, then performs a 302 redirect to the target URL.

## Core Database Schemas (Mongoose)
**1. User Schema**
*   `email`, `registerNumber`, `name`
*   `activityStreak` (Number)
*   `engagementLogs`: Array of `{ contestId, clickedAt }`
*   `targetTier`: String ('5LPA', '10LPA', '10+LPA')

**2. Contest/Event Schema**
*   `title`, `platform` (LeetCode, CodeChef, Skillrack, TCS NQT)
*   `url` (Direct registration link)
*   `startTime`, `duration`
*   `category` (Coding, Aptitude, Hackathon, Certification)