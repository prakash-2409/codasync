# PROGRESS TRACKER & LIVE STATE

## Current Status
*   **Phase:** Phase 1 (Backend Initialization)
*   **Latest Changes:** Initialized documentation for AI agent context.
*   **Current Blockers:** None.

## Phase 1: Backend Foundation (In Progress)
- [ ] Initialize Node/Express project (`npm init`, install dependencies).
- [ ] Setup standard folder structure (`controllers`, `models`, `routes`, `utils`).
- [ ] Create `Contest` and `User` Mongoose models.
- [ ] Build the `/api/redirect` smart routing middleware.
- [ ] Set up basic Error Handling middleware.

## Phase 2: Automated Ingestion Pipeline (Pending)
- [ ] Setup `node-cron` job running every 12 hours.
- [ ] Integrate CLIST API to fetch upcoming Codeforces, LeetCode, CodeChef contests.
- [ ] Write logic to filter and save public contests to MongoDB without duplication.
- [ ] Create admin endpoint for manual injection of private tests (Skillrack, Infosys).

## Phase 3: Frontend Initialization (Pending)
- [ ] Scaffold React application.
- [ ] Configure Tailwind CSS with the `warm-brown`, `parchment`, and `sienna` theme parameters.
- [ ] Build the "Next-Best-Action" Single-Card UI component.
- [ ] Build the GitHub-style consistency heatmap component.

## Phase 4: Placement Logic Integration (Pending)
- [ ] Integrate user stats fetching (LeetCode solved counts, CodeChef ratings).
- [ ] Write recommendation algorithm comparing user stats against the 5/10 LPA placement criteria.