# Schema

### 1. Table by Table: Columns and Types

#### `users`
- `id` (`TEXT PRIMARY KEY`): UUID identifier.
- `email` (`TEXT UNIQUE NOT NULL`): Normalized lowercase login address.
- `password_hash` (`TEXT NOT NULL`): Salted bcrypt password hash.
- `name` (`TEXT NOT NULL`): Display name.
- `role` (`TEXT NOT NULL CHECK(role IN ('recruiter', 'interviewer'))`): Access control role.
- `created_at` (`TEXT NOT NULL`): ISO 8601 UTC timestamp.

#### `job_openings`
- `id` (`TEXT PRIMARY KEY`): UUID identifier.
- `title` (`TEXT NOT NULL`): Role title.
- `department` (`TEXT NOT NULL`): Business unit (Engineering, Sales, DevOps, etc.).
- `description` (`TEXT NOT NULL`): Role scope and responsibilities.
- `status` (`TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed', 'archived'))`): Lifecycle status.
- `created_at` (`TEXT NOT NULL`): ISO 8601 UTC timestamp.
- `updated_at` (`TEXT NOT NULL`): ISO 8601 UTC timestamp.

#### `applications`
- `id` (`TEXT PRIMARY KEY`): UUID identifier.
- `job_opening_id` (`TEXT NOT NULL REFERENCES job_openings(id) ON DELETE RESTRICT`): Parent job.
- `candidate_name` (`TEXT NOT NULL`): Full candidate name.
- `candidate_email` (`TEXT NOT NULL`): Candidate contact email.
- `source` (`TEXT NOT NULL`): Acquisition channel (LinkedIn, Referral, Job Board, etc.).
- `notes` (`TEXT DEFAULT ''`): Freeform recruiter notes.
- `stage` (`TEXT NOT NULL DEFAULT 'applied' CHECK(stage IN ('applied', 'screening', 'interview', 'offer', 'hired'))`): Current active pipeline stage.
- `is_rejected` (`INTEGER NOT NULL DEFAULT 0 CHECK(is_rejected IN (0, 1))`): Boolean rejection flag.
- `stage_before_rejection` (`TEXT NULL`): Snapshot of stage when rejection occurred, enabling exact reinstatement.
- `stage_entered_at` (`TEXT NOT NULL`): Timestamp when current stage was entered (resets on stage transition or reinstatement for stalled calculation).
- `created_at` (`TEXT NOT NULL`): ISO 8601 UTC timestamp.
- `updated_at` (`TEXT NOT NULL`): ISO 8601 UTC timestamp.

#### `interview_panel`
- `id` (`TEXT PRIMARY KEY`): UUID identifier.
- `application_id` (`TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE`): Target candidate.
- `interviewer_id` (`TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT`): Assigned interviewer.
- `assigned_at` (`TEXT NOT NULL`): ISO 8601 UTC timestamp.
- **Constraints**: `UNIQUE(application_id, interviewer_id)`.

#### `application_timeline` (Immutable Audit Log)
- `id` (`TEXT PRIMARY KEY`): UUID identifier.
- `application_id` (`TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE`): Target candidate.
- `actor_id` (`TEXT REFERENCES users(id) ON DELETE SET NULL`): User who performed the action.
- `actor_name` (`TEXT NOT NULL`): Redundant string snapshot of actor name at event time.
- `event_type` (`TEXT NOT NULL CHECK(event_type IN ('created', 'stage_change', 'rejected', 'reinstated', 'feedback'))`): Categorization.
- `details` (`TEXT NOT NULL`): Structured JSON storing event parameters (from/to stage, ratings, notes).
- `created_at` (`TEXT NOT NULL`): ISO 8601 UTC timestamp.
- **Database Triggers**: `BEFORE UPDATE` and `BEFORE DELETE` triggers that immediately `RAISE(ABORT, ...)` preventing any modification or deletion.

#### `stalled_alert_dismissals`
- `id` (`TEXT PRIMARY KEY`): UUID identifier.
- `application_id` (`TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE`): Candidate whose alert was dismissed.
- `user_id` (`TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`): Recruiter who dismissed the alert.
- `dismissed_stage` (`TEXT NOT NULL`): The stage for which the alert was dismissed.
- `dismissed_at` (`TEXT NOT NULL`): ISO 8601 UTC timestamp.
- **Constraints**: `UNIQUE(application_id, user_id, dismissed_stage)`.

---

### 2. Which relationships are one-to-many, and which are many-to-many?

- **One-to-Many**:
  - `job_openings` (1) → `applications` (N): An opening has many applications, but each application belongs strictly to one opening.
  - `applications` (1) → `application_timeline` (N): Each application has an ordered append-only sequence of timeline entries.
  - `applications` (1) → `stalled_alert_dismissals` (N): An application can have dismissals across different stages or recruiters.
- **Many-to-Many**:
  - `applications` (M) ↔ `users` (N) via `interview_panel`: An application can have multiple interviewers assigned to its panel, and an interviewer can be assigned to multiple candidates across any job opening.

---

### 3. Which constraints are enforced by the database, and which by application code — and why did you draw the line there?

- **Database-Enforced**:
  - **Referential Integrity**: Foreign keys with `ON DELETE RESTRICT` for jobs having active applications (protecting against accidental cascades) and `ON DELETE CASCADE` for interview panels, timeline, and dismissals.
  - **Domain Restrictions**: Check constraints for valid enum-like values (`role`, `status`, `stage`, `event_type`).
  - **Uniqueness**: Unique constraints on user email, panel assignments `(application_id, interviewer_id)`, and dismissals `(application_id, user_id, dismissed_stage)`.
  - **Audit Immutability**: Database triggers `trg_prevent_timeline_update` and `trg_prevent_timeline_delete` strictly reject any mutation or deletion on `application_timeline`.
- **Application-Enforced**:
  - **Sequential Pipeline Progression**: The business rule that `Applied → Screening → Interview → Offer → Hired` can only advance one step forward at a time, and never skip stages. The application checks the transition graph and outputs a clear human-readable error explaining what was illegal.
  - **Role-Based Access Control Scoping**: Enforcing that interviewers can only query candidates assigned to their panel.
  - **Role Verification on Assignment**: Verifying that a user being assigned to an interview panel actually holds the `interviewer` role.
- **Why draw the line here?**:
  Core data invariants (foreign keys, uniqueness, audit immutability) belong in the database so that no errant query or manual SQL tool can corrupt state. Business workflows (e.g. error messaging on stage skipping, dynamic eligibility calculations in bulk actions) belong in application code to provide friendly user feedback and maintain composability.

---

### 4. What did you deliberately denormalise?

1. **`stage_before_rejection` on `applications`**: Rather than running a subquery across the `application_timeline` table to locate the previous stage prior to the most recent rejection event, we persist `stage_before_rejection` directly on the application row. This makes reinstatement an $O(1)$ indexed update and eliminates ambiguity.
2. **`stage_entered_at` on `applications`**: Cached timestamp of when the candidate entered their current stage. This allows instant $O(1)$ indexing and filtering for stalled applications (>10 days) without scanning the entire timeline table.
3. **`actor_name` on `application_timeline`**: Storing the snapshot name at the moment the event occurred preserves true historical audit fidelity even if the user's name is updated later.

---

### 5. What would break first if this had 100x the data?

1. **Dashboard Weekly Trend Queries**: Aggregating quarterly weekly counts across millions of application rows would slow down if doing table scans. At 100x scale, this would be replaced with a daily roll-up summary table or materialized view.
2. **Single SQLite File Lock Contention**: SQLite operates with file-level/WAL concurrency. At 100x concurrent write throughput, migrating to PostgreSQL (e.g., Supabase / RDS) with row-level locking and connection pooling (PgBouncer) is the natural transition.
3. **Full-Text Candidate Search**: At 100x data, SQL `LIKE '%term%'` on unindexed candidate names and emails will degrade. Adding SQLite FTS5 or PostgreSQL `pg_trgm` / `tsvector` indexes would be required.
