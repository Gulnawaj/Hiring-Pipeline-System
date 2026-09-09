# Schema

### 1. Collection by Collection: Fields and Types

#### `users`

- `email` (`String`, required, unique, indexed): User's login email.
- `password_hash` (`String`, required): Hashed password.
- `name` (`String`, required): User's display name.
- `role` (`String`, required, enum: `recruiter` | `interviewer`): User's role.
- `created_at` (`Date`): Automatically created timestamp.

#### `job_openings`

- `title` (`String`, required): Job title.
- `department` (`String`, required): Department associated with the role.
- `description` (`String`, required): Job description.
- `status` (`String`, enum: `open` | `closed` | `archived`, default: `open`): Current job status.
- `created_at` (`Date`): Automatically created timestamp.
- `updated_at` (`Date`): Automatically updated timestamp.

#### `applications`

- `job_opening_id` (`ObjectId`, required, indexed, references `JobOpening`): Job opening to which the application belongs.
- `candidate_name` (`String`, required, indexed): Candidate's name.
- `candidate_email` (`String`, required, indexed): Candidate's email.
- `source` (`String`, required): Source of the application.
- `notes` (`String`, default: `''`): Optional recruiter notes.
- `stage` (`String`, enum: `applied` | `screening` | `interview` | `offer` | `hired`, default: `applied`, indexed): Current pipeline stage.
- `is_rejected` (`Number`, default: `0`): Indicates whether the application is rejected.
- `stage_before_rejection` (`String`, optional): Stores the stage from which the application was rejected for exact reinstatement.
- `stage_entered_at` (`Date`, default: current date/time): Records when the application entered its current stage.
- `created_at` (`Date`): Automatically created timestamp.
- `updated_at` (`Date`): Automatically updated timestamp.

#### `interview_panels`

- `application_id` (`ObjectId`, required, references `Application`): Application associated with the interviewer assignment.
- `interviewer_id` (`ObjectId`, required, indexed, references `User`): Interviewer assigned to the application.
- `assigned_at` (`Date`, default: current date/time): Time when the interviewer was assigned.
- `scheduled_at` (`Date`, default: `null`): Scheduled interview date and time, when provided.
- **Constraint:** A unique compound index on `(application_id, interviewer_id)` prevents the same interviewer from being assigned to the same application more than once.

#### `application_timelines`

- `application_id` (`ObjectId`, required, indexed, references `Application`): Application associated with the event.
- `actor_id` (`ObjectId`, references `User`, default: `null`): User who performed the action.
- `actor_name` (`String`, required): Actor's name stored with the event.
- `event_type` (`String`, required): Type of timeline event, such as `created`, `stage_change`, `rejected`, `reinstated`, `feedback`, and interviewer assignment events.
- `details` (`String`, required): Details associated with the event.
- `created_at` (`Date`, default: current date/time, indexed): Time when the event was created.
- **Immutability:** Mongoose middleware blocks update and delete operations on existing timeline records.

#### `stalled_alert_dismissals`

- `application_id` (`ObjectId`, required, references `Application`): Application whose stalled alert was dismissed.
- `user_id` (`ObjectId`, required, references `User`): Recruiter who dismissed the alert.
- `dismissed_stage` (`String`, required): Stage for which the alert was dismissed.
- `dismissed_at` (`Date`, default: current date/time): Time when the alert was dismissed.
- **Constraints:** A unique compound index on `(application_id, user_id, dismissed_stage)` prevents duplicate dismissal records for the same application, recruiter, and stage. An additional index on `(application_id, user_id)` supports lookup of dismissals.

---

### 2. Which relationships are one-to-many, and which are many-to-many?

- **One-to-Many:**

  - `job_openings` (1) → `applications` (N): A job opening can have many applications, while each application references one job opening.
  
  - `applications` (1) → `application_timelines` (N): An application can have many timeline events.
  
  - `applications` (1) → `interview_panels` (N): An application can have multiple interviewer assignments.
  
  - `applications` (1) → `stalled_alert_dismissals` (N): An application can have multiple dismissal records for different stages or recruiters.
  
  - `users` (1) → `interview_panels` (N): An interviewer can be assigned to multiple applications.

- **Many-to-Many:**

  - `applications` (M) ↔ `users` (N) through `interview_panels`: One application can have multiple interviewers, and one interviewer can be assigned to multiple applications.



### 3. Which constraints are enforced by the database, and which by application code — and why did you draw the line there?

- **MongoDB / Index-Enforced:**

  - **Uniqueness:** Unique indexes enforce unique user emails, unique `(application_id, interviewer_id)` assignments, and unique `(application_id, user_id, dismissed_stage)` alert dismissals.
  
  - **Indexes:** Indexes are defined for commonly queried fields such as application job opening, candidate name, candidate email, stage, interviewer, and timeline creation time.

- **Mongoose-Enforced:**

  - **Required fields:** Mongoose validates fields marked as required.
  
  - **Allowed values:** Mongoose enum validation restricts user roles, job statuses, and application stages to supported values.
  
  - **Data types:** Mongoose validates fields according to their declared types, such as `String`, `Number`, `Date`, and `ObjectId`.
  
  - **Timeline immutability:** Mongoose middleware rejects update and delete operations on timeline records.

- **Application-Enforced:**

  - **Sequential pipeline progression:** The backend only allows `Applied → Screening → Interview → Offer → Hired` one stage at a time and rejects skipped stages. :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}
  
  - **Rejection and reinstatement:** The backend stores the previous stage on rejection and restores it when the application is reinstated. :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4}
  
  - **Role-based access:** Backend authorization restricts recruiter and interviewer operations, and interviewers can access only applications assigned to them. :contentReference[oaicite:5]{index=5}
  
  - **Interviewer assignment validation:** The backend verifies that an assigned user has the `interviewer` role. :contentReference[oaicite:6]{index=6}
  
  - **Active duplicate application rule:** The backend prevents another active application for the same candidate email and job opening while allowing rejected applications to remain. :contentReference[oaicite:7]{index=7}
  
  - **Stalled alerts:** The backend determines when an application has remained in its current stage for at least 10 days and applies stage-specific dismissals.

- **Why draw the line here?**

  MongoDB indexes handle uniqueness and query support, while Mongoose handles document structure and validation. Business rules that depend on user roles, application state, and hiring workflow are enforced in the backend because they require application context rather than simple field-level validation.



### 4. What did you deliberately denormalise?

1. **`stage_before_rejection` on `applications`**: Stores the exact stage from which an application was rejected, avoiding the need to search the timeline during reinstatement.

2. **`stage_entered_at` on `applications`**: Stores when the application entered its current stage, allowing the stalled-alert logic to determine how long the application has remained in that stage directly.

3. **`actor_name` on `application_timelines`**: Stores the actor's name with the event so the historical event retains the name associated with the action at that time.



### 5. What would break first if this had 100x the data?

1. **Dashboard weekly trend queries**: The dashboard currently performs a separate `countDocuments()` query for each of the 12 weekly buckets. At much larger data volumes, this repeated querying could become expensive. A single aggregation or precomputed weekly summary would be a natural optimization.

2. **Dashboard application loading and in-memory grouping**: The dashboard loads applications and then groups and counts them in JavaScript. With much more data, returning and processing large application sets in the Node.js process would consume more memory and CPU. MongoDB aggregation could move more of this work into the database.

3. **Stalled alert processing**: Alert retrieval loads stalled applications, related dismissals, and interview panels and then filters them in application code. At much larger scale, combining more of this filtering into MongoDB aggregation and adding targeted indexes would reduce the amount of data handled in memory.

4. **Application text search**: Candidate name and email are indexed, but the current search uses case-insensitive regular expressions. At much larger scale, flexible substring searches could become slower and may require a dedicated text-search strategy or additional indexes.

5. **CSV export size**: The export currently loads all non-rejected applications before generating the CSV response. With 100x more applications, memory usage and response time could become a concern. Streaming or batched export processing would be a better approach at larger scale.