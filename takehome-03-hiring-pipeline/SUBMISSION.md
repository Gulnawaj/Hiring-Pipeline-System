# Submission

## Links

- **GitHub repository:** https://github.com/Gulnawaj/Hiring-Pipeline-System
- **Live application:** <deployed URL>

## Notes for the reviewer

The backend uses Node.js with built-in SQLite (`node:sqlite`). Database immutability triggers enforce that audit timeline entries cannot be updated or deleted even via direct SQL operations. The application comes pre-seeded with realistic candidate data, interviews, historical timeline items, and stalled candidate records ready for review.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Recruiter | `recruiter@example.com` | `Password123!` |
| Interviewer 1 | `interviewer1@example.com` | `Password123!` |
| Interviewer 2 | `interviewer2@example.com` | `Password123!` |
| Interviewer 3 | `interviewer3@example.com` | `Password123!` |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React + Vite + TypeScript + Vanilla CSS | Fast client-side reactivity, role-tailored workspaces, zero build overhead. |
| Backend | Node.js + Express + TypeScript | Lightweight, robust typing, modular route architecture, and fast cold starts. |
| Database | SQLite (`node:sqlite`) | Built-in zero-dependency ACID storage with foreign key constraints and audit immutability triggers. |
| Hosting | Vercel (Client) & Render (Backend) | Reliable free tier with separate static CDN distribution and containerized API hosting. |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Recruiter and Interviewer roles strictly enforced on the server. |
| 2 | Job openings | Done | Full CRUD, soft archiving/restoration, and application protection. |
| 3 | Applications inside job openings | Done | Applications bound to openings with candidate details and notes. |
| 4 | A pipeline with rules | Done | Sequential progression (`Applied → Screening → Interview → Offer → Hired`), rejection, and exact previous-stage reinstatement. |
| 5 | Interview panel | Done | Multi-interviewer assignment, role validation, and scoped interviewer list view. |
| 6 | Finding candidates | Done | Server-side text search, multi-field filtering, multi-column sorting, and pagination with total counts. |
| 7 | Acting on many candidates at once | Done | Bulk-advance and bulk-reject with per-candidate result reporting; CSV snapshot export. |
| 8 | A dashboard | Done | Headline KPI cards, breakdown by job opening and stage, 12-week quarterly trend charts. |
| 9 | History you cannot rewrite | Done | Append-only timeline with creation, stage changes, rejections, reinstatements, and feedback; locked by DB triggers. |
| 10 | Stalled-application alerts | Done | >10 day inactivity detection, nav badge counter, and stage-aware dismissal return logic. |

## How much time did you actually spend?

Around 7–8 hours total, split into requirements modeling, backend implementation, automated verification, frontend workspace, and documentation.

## What would you do next, with another 12 hours?

1. Implement structured interview scorecard templates with rubric criteria per job role.
2. Add automated email digest notifications for recruiters summarizing candidates approaching the 10-day stalled threshold.
3. Add candidate-facing self-service interview slot booking.

## What are you least happy with in this codebase, and why?

In SQLite, full-text search currently relies on SQL `LIKE '%pattern%'`. While blazingly fast for thousands of rows, adding SQLite FTS5 virtual tables or migrating to PostgreSQL `pg_trgm` would provide superior fuzzy matching and phonetic search at enterprise scale.
