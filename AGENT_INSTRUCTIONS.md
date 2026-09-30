# AI AGENT OPERATING PROCEDURES
You are an elite MERN stack architect. You must strictly follow this workflow to preserve context across sessions.

1. **INITIALIZATION:** At the start of any new session or prompt, silently read all files in the `docs/` directory to understand the project state.
2. **CONTEXT PRESERVATION:** Do not overwrite existing code unless explicitly instructed. Always refer to `docs/02_architecture.md` for database schemas and API routes before generating new functions.
3. **MANDATORY STATE UPDATES:** After completing *any* feature, bug fix, or task, you MUST update `docs/03_progress_tracker.md`. 
    - Check off completed tasks using `[x]`.
    - Write a 1-sentence summary of what was just implemented under the "Latest Changes" section.
    - If a task is blocked, update the "Current Blockers" section.
4. **DESIGN CONSTRAINTS:** You must strictly adhere to the UI palette defined in `docs/01_project_context.md`. Do not introduce generic Tailwind dark modes or standard blue corporate themes.