# Schema

### 1. Collection by Collection: Fields and Types

#### `User`

- `email` (`String`, required, unique): User's login email. A unique index prevents duplicate email addresses.
- `password_hash` (`String`, required): Hashed password.
- `name` (`String`, required): User's display name.
- `role` (`String`, required, enum: `recruiter` | `interviewer`): User's role.
- `created_at` (`Date`): Automatically created timestamp.

#### `JobOpening`

- `title` (`String`, required): Job title.
- `department` (`String`, required): Department associated with the role.
- `description` (`String`, required): Job description.
- `status` (`String`, default: `open`, enum: `open` | `closed` | `archived`): Current job status.
- `created_at` (`Date`): Automatically created timestamp.
- `updated_at` (`Date`): Automatically updated timestamp.

#### `Application`

- `job_opening_id` (`ObjectId`, required, indexed, references `JobOpening`): Job opening to which the application belongs.
- `candidate_name` (`String`, required, indexed): Candidate's name.
- `candidate_email` (`String`, required, indexed): Candidate's email.
- `source` (`String`, required): Source of the application.
- `notes` (`String`, default: `''`): Optional application notes.
- `stage` (`String`, default: `applied`, enum: `applied` | `screening` | `interview` | `offer` | `hired`, indexed): Current pipeline stage.
- `is_rejected` (`Number`, default: `0`): Indicates whether the application is rejected.
- `stage_before_rejection` (`String`, optional): Stores the stage from which the application was rejected for exact reinstatement.
- `stage_entered_at` (`Date`, default: `Date.now`): Records when the application entered its current stage.
- `created_at` (`Date`): Automatically created timestamp.
- `updated_at` (`Date`): Automatically updated timestamp.

#### `InterviewPanel`

- `application_id` (`ObjectId`, required, references `Application`): Application associated with the interviewer assignment.
- `interviewer_id` (`ObjectId`, required, indexed, references `User`): Interviewer assigned to the application.
- `assigned_at` (`Date`, default: `Date.now`): Time when the interviewer was assigned.
- `scheduled_at` (`Date`, default: `null`): Scheduled interview date and time, when provided.
- **Unique index:** A unique compound index on `{ application_id: 1, interviewer_id: 1 }` prevents the same interviewer from being assigned to the same application more than once.

#### `ApplicationTimeline`

- `application_id` (`ObjectId`, required, indexed, references `Application`): Application associated with the event.
- `actor_id` (`ObjectId`, default: `null`, references `User`): User who performed the action.
- `actor_name` (`String`, required): Actor's name stored with the event.
- `event_type` (`String`, required): Type of timeline event, such as `created`, `stage_change`, `rejected`, `reinstated`, `feedback`, or `interviewer_assigned`. These values are used by the application but are not enforced by a schema enum.
- `details` (`String`, required): Details associated with the timeline event.
- `created_at` (`Date`, default: `Date.now`, indexed): Time when the event was created.
- **Immutability:** Mongoose `pre` middleware explicitly blocks `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, and `findOneAndDelete` operations on timeline records. The `deleteOne` hook allows an empty-query bypass used only during database seeding.

#### `StalledAlertDismissal`

- `application_id` (`ObjectId`, required, references `Application`): Application whose stalled alert was dismissed.
- `user_id` (`ObjectId`, required, references `User`): Recruiter who dismissed the alert.
- `dismissed_stage` (`String`, required): Stage for which the alert was dismissed.
- `dismissed_at` (`Date`, default: `Date.now`): Time when the alert was dismissed.
- **Unique index:** A unique compound index on `{ application_id: 1, user_id: 1, dismissed_stage: 1 }` prevents duplicate dismissal records for the same application, recruiter, and stage.
- **Query-performance index:** An additional index on `{ application_id: 1, user_id: 1 }` supports dismissal lookups.

---

### 2. Which relationships are one-to-many, and which are many-to-many?

- **One-to-Many:**

  - `JobOpening` (1) → `Application` (N): A job opening can have many applications, while each application references one job opening.

  - `Application` (1) → `ApplicationTimeline` (N): An application can have many timeline events.

  - `Application` (1) → `InterviewPanel` (N): An application can have multiple interviewer assignments.

  - `Application` (1) → `StalledAlertDismissal` (N): An application can have multiple dismissal records.

  - `User` (1) → `InterviewPanel` (N): An interviewer can be assigned to multiple applications.

- **Many-to-Many:**

  - `Application` (M) ↔ `User` (N) through `InterviewPanel`: One application can have multiple interviewers, and one interviewer can be assigned to multiple applications. `InterviewPanel` acts as the linking collection for this relationship.

---

### 3. Which constraints are enforced by the database, and which by application code — and why did you draw the line there?

#### MongoDB-level

- **Unique indexes:** MongoDB unique indexes enforce unique user emails, unique `{ application_id: 1, interviewer_id: 1 }` interview assignments, and unique `{ application_id: 1, user_id: 1, dismissed_stage: 1 }` alert dismissals.

- **Query-performance indexes:** Regular indexes are used on frequently queried fields such as `job_opening_id`, `candidate_name`, `candidate_email`, `stage`, `interviewer_id`, `application_id`, and `created_at`. These indexes improve query performance but do not enforce data-integrity rules.

#### Mongoose-level

- **Required fields:** Mongoose validates fields marked as `required`.

- **Allowed values:** Mongoose enum validation restricts fields such as user roles, job status, and application stages to their supported values.

- **Data types and defaults:** Mongoose validates declared types such as `ObjectId`, `String`, `Number`, and `Date`, and applies configured default values.

- **Timeline immutability:** `ApplicationTimeline.js` uses Mongoose `pre` hooks to reject update and delete operations on timeline records. This is model-level protection, not a MongoDB database trigger.

#### Application-code level

- **JWT authentication:** `auth.middleware.js` verifies the JWT and identifies the authenticated user before protected routes are accessed.

- **Role-based authorization:** `role.middleware.js` restricts recruiter-only and interviewer-specific operations.

- **Interviewer-only access to assigned applications:** `applications.controller.js` checks whether an interviewer is assigned to the application before allowing access to its details.

- **Interviewer access scoping for job openings:** `jobs.controller.js` restricts interviewers to viewing only job openings that contain applications they are assigned to.

- **Interviewer access to timeline and feedback:** `timeline.controller.js` checks whether an interviewer is assigned to the application before allowing access to its timeline or feedback submission.

- **Sequential pipeline progression:** `pipeline.controller.js` enforces the order `Applied → Screening → Interview → Offer → Hired` and rejects skipped stages.

- **Rejection and reinstatement:** `pipeline.controller.js` stores the current stage in `stage_before_rejection` when an application is rejected and restores that stage when it is reinstated.

- **Bulk action behavior:** `pipeline.controller.js` processes bulk advance and bulk reject actions application-by-application and returns individual success or refusal results.

- **Interviewer role validation:** `applications.controller.js` verifies that the selected user has the `interviewer` role before creating an interviewer assignment.

- **Active duplicate application prevention:** `applications.controller.js` prevents another active application for the same candidate email and job opening, while allowing previously rejected applications to remain.

- **Candidate name validation:** `applications.controller.js` rejects candidate names containing numbers or invalid alphanumeric combinations.

- **Interview scheduling validation:** `applications.controller.js` validates the supplied `scheduled_at` value before storing it.

- **Feedback validation:** `timeline.controller.js` validates that feedback includes at least one of comments, rating (1–5), or recommendation before creating a timeline event.

- **Timeline immutability at the controller level:** `timeline.controller.js` explicitly returns 403 for any PUT or DELETE request targeting a timeline event, providing a second layer of protection alongside the Mongoose middleware.

- **Stalled alert calculation and stage-aware dismissals:** `alerts.controller.js` identifies applications that have remained in the same stage for at least 10 days and excludes alerts that were dismissed for that specific stage.

#### Why draw the line here?

- **MongoDB unique indexes** provide foundational database-level uniqueness.
- **Mongoose schema rules** define document structure, validation, defaults, and model-level protections.
- **Backend middleware and controllers** enforce workflow, permissions, and business rules that depend on the current user, application state, or relationships between records.

This separation keeps structural data rules close to the data model while keeping changing hiring workflow rules in application code.

---

### 4. What did you deliberately denormalise?

1. **`stage_before_rejection` on `Application`:** Stores the exact stage from which an application was rejected. This avoids querying the timeline to determine where the application should return during reinstatement.

2. **`stage_entered_at` on `Application`:** Stores when the application entered its current stage. Although this information could be derived from timeline events, storing it directly allows the stalled-alert logic to query the current stage age without processing historical timeline records.

3. **`actor_name` on `ApplicationTimeline`:** Stores the actor's name alongside `actor_id`. This preserves the name associated with the event even if the user's name later changes or the user is no longer available.

---

### 5. What would break first if this had 100x the data?

1. **Dashboard weekly trend calculations:** The dashboard currently executes a separate `countDocuments()` query for each of the 12 weekly buckets. With much more data, this repeated querying would likely become a scaling pressure point. A single MongoDB aggregation using `$group`, or precomputed weekly summaries, could reduce the repeated work.

2. **Dashboard application loading and in-memory grouping:** The dashboard loads large application result sets and performs part of the grouping and counting in Node.js. At much larger scale, moving these aggregations into MongoDB would reduce memory usage and server-side processing.

3. **CSV export size:** `export.controller.js` currently loads all non-rejected applications into memory and builds the complete CSV string before sending the response. With a much larger dataset, memory usage and response time could become significant. A future optimization would be to process the MongoDB cursor in batches and stream CSV rows to the HTTP response instead of constructing the entire file in memory.

4. **Application text search:** `applications.controller.js` uses case-insensitive regular expressions to search candidate names and emails. Substring regex searches may not make effective use of standard indexes and can become inefficient at larger scale. A more suitable search strategy, such as MongoDB Atlas Search or another dedicated text-search approach, could be introduced.

5. **Stalled alert processing:** `alerts.controller.js` retrieves stalled applications, dismissals, and interview panels and then performs some filtering in Node.js. As the amount of data grows, this could increase memory use and processing time. More of the filtering could be moved into MongoDB through aggregation and targeted queries.