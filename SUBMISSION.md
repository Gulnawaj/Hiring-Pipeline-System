# Submission

## Links

- **GitHub repository:** https://github.com/Gulnawaj/Hiring-Pipeline-System
- **Live application:**  https://hiring-pipeline-system-isim.vercel.app

## Notes for the reviewer

This project implements a hiring pipeline system with separate recruiter and interviewer workflows.

Recruiters can manage job openings, applications, pipeline stages, interviewer assignments, bulk actions, dashboard metrics, stalled-application alerts, and CSV pipeline exports.

Interviewers only see applications assigned to them and can submit interview feedback. Permissions are enforced on the server rather than only through the frontend.

The application includes seeded demo data covering different pipeline stages, rejected and hired candidates, interviewer assignments, interview feedback, timeline history, and stalled applications so the main requirements can be reviewed without creating everything manually.

The database is MongoDB Atlas and the backend uses Mongoose. Application timeline records are treated as immutable audit history, with update/delete operations blocked so existing history cannot be rewritten.

## Demo credentials

| Role | Name | Email | Password |
|---|---|---|---|
| Recruiter | Sarah | sarah@gmail.com | Password123! |
| Interviewer | Vikas Kumar | vikas@gmail.com | Password123! |
| Interviewer | Rohan Singh | rohan@gmail.com | Password123! |
| Interviewer | Gulnawaj | gulnawaj@gmail.com | Password123! |

## Stack

| Layer | What you used | Why |
|---|---|---|
| Frontend | React + Vite + JavaScript/JSX | Component-based UI for recruiter and interviewer workflows. |
| Backend | Node.js + Express | REST API with server-side authentication, authorization, validation, and business rules. |
| Database | MongoDB Atlas + Mongoose | Document database with schema modeling, relationships through ObjectIds, and persistent application data. |
| Hosting | Vercel (Client) & (Backend) | Separate deployment for the frontend and backend. |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Recruiter and Interviewer accounts with server-enforced role permissions. |
| 2 | Job openings | Done | Create and edit job openings, open/closed status, archive/restore, and preservation of existing applications. |
| 3 | Applications inside job openings | Done | Each application belongs to one job opening and stores candidate name, email, source, and notes. |
| 4 | A pipeline with rules | Done | Sequential progression from `Applied → Screening → Interview → Offer → Hired`, rejection from any stage, and reinstatement to the exact stage before rejection. Forward skipping is rejected by the server. |
| 5 | Interview panel | Done | Multiple interviewers can be assigned to an application. Interviewer access is limited to their assigned applications. Interview scheduling is also supported. |
| 6 | Finding candidates | Done | Server-side candidate name/email search, job/stage/source filters, sorting, pagination, and total-match counts. |
| 7 | Acting on many candidates at once | Done | Bulk advance and bulk reject return individual success/refusal results. Pipeline snapshot CSV export is included. |
| 8 | A dashboard | Done | Open positions, active applications, interviews scheduled this week, hires this month, job/stage breakdowns, and a weekly applications trend for the last 12 weeks. |
| 9 | History you cannot rewrite | Done | Application timeline records creation, stage changes, rejection, reinstatement, and interviewer feedback. Timeline records are protected from update/delete operations. |
| 10 | Stalled-application alerts | Done | Applications stalled for more than 10 days appear in alerts, with a navigation badge and stage-specific dismissal behavior. Alerts can return when an application later enters and stalls in another stage. |

## How much time did you actually spend?

Approximately 13-18 hours including requirements analysis, backend implementation, frontend implementation, testing, debugging, and documentation.

## What would you do next, with another 12 hours?

1. I would also add source-of-hire reporting to analyze where successful candidates are coming from.

2. I would optimize my code by adding new features that can make the project more clean and advanced.


## What are you least happy with in this codebase, and why?

I would improve the consistency of error handling across the application. The main workflows handle API failures, but with more time I would standardize error responses and frontend error states so failures are presented more consistently to users.
