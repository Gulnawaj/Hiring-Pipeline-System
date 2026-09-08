# Decisions

Log of the architectural and technical decisions that shaped this codebase.

---

## Decision 1: Database Engine & Local Persistence

- **Chose:** Node.js standard built-in SQLite (`node:sqlite` via `DatabaseSync`).
- **Rejected:** Standalone external PostgreSQL service or heavy native C++ driver modules (`better-sqlite3`, `sqlite3` via node-gyp).
- **Why:** Node.js v24 includes native SQLite 3 directly in the runtime standard library. It requires zero external dependencies, zero native C++ compilation toolchains (avoiding Windows Visual Studio Build Tools issues), and zero network latency. It provides full ACID transaction guarantees, foreign keys, and trigger support while keeping local setup effortless.

---

## Decision 2: Audit Timeline Immutability Enforcement (Goal 9)

- **Chose:** SQLite database triggers (`BEFORE UPDATE` and `BEFORE DELETE` with `RAISE(ABORT)`) paired with application-level route blocks.
- **Rejected:** Application-only checks (e.g. simply not exposing a `DELETE` endpoint).
- **Why:** Goal 9 explicitly mandates: *"Nothing in it can be edited or deleted after the fact, including by recruiters."* An application-level check can be accidentally bypassed by maintenance scripts, direct database queries, or future code changes. Implementing database-level triggers guarantees that no query can mutate or delete an audit event once committed.

---

## Decision 3: Pipeline Reinstatement Architecture (Goal 4)

- **Chose:** Explicit snapshot column `stage_before_rejection` on the `applications` table.
- **Rejected:** Scanning the `application_timeline` table on the fly to find the most recent stage before rejection.
- **Why:** Goal 4 requires that an application rejected from any stage be reinstated back to the exact stage it was rejected from, rather than resetting to `Applied`. Parsing the timeline log is vulnerable to schema evolution and requires multi-row joins. Storing `stage_before_rejection` as an indexed snapshot column guarantees $O(1)$ lookup and foolproof reinstatement.

---

## Decision 4: Stalled Alert Dismissal Scoping (Goal 10)

- **Chose:** Dismissal table tracking `(application_id, user_id, dismissed_stage)`.
- **Rejected:** A simple boolean column `is_alert_dismissed` on the `applications` table.
- **Why:** Goal 10 states: *"A recruiter can dismiss an alert for a specific application. If that application later advances and then stalls in its new stage for the same length of time, the alert returns."* A simple boolean flag would permanently silence alerts. By keying dismissals to the candidate's stage at the time of dismissal, when the candidate advances to a new stage, the current stage no longer matches `dismissed_stage`, automatically resurrecting the alert if the candidate stalls again.

---

## Decision 5: Client Workspace & Directory Organization

- **Chose:** Scaffolding a standalone `client/` Single-Page Application communicating via REST API with `backend/`.
- **Rejected:** Single monorepo hybrid bundling or server-rendered template monolith (e.g. EJS/Pug).
- **Why:** Clear decoupling of client and server allows independent scaling, distinct hosting targets (e.g. Vercel for client static assets, Render for API), and strict enforcement of the server-side API boundary required by the assignment.
- **Later reversed:** Initially planned to organize the frontend layer in a folder named `frontend`, but reversed this decision to use `client/` after updating the directory naming to match the repository's client structure.
