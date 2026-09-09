# AI Prompts

## Frontend Architecture and Implementation

### Prompt

Build the frontend for the Hiring Pipeline project using React.js and Tailwind CSS strictly. 
First inspect the existing backend APIs and then create the necessary frontend pages, components, 
API files, authentication, role-based UI, application pipeline, dashboard, alerts, interview panel, 
search/filtering, pagination, bulk actions, CSV export, and application timeline required to satisfy 
all 10 assignment goals.

Do not modify the existing backend logic or assignment requirements. Keep the frontend connected to 
the existing backend APIs and make the implementation simple, clean, responsive, and functional.

### What I Got

The frontend architecture and required pages/components were created based on the 10 goals. 
The frontend was connected to the existing backend APIs and role-specific functionality was added 
for recruiters and interviewers.

### What I Corrected

The frontend was reviewed against all 10 goals to ensure that important functionality such as 
server-side filtering, pagination, bulk actions, pipeline rules, interviewer assignments, timeline, 
CSV export, and stalled-application alerts were properly handled.


### Tailwind CSS Version and Configuration Issue

#### Prompt

I want to use Tailwind CSS in my React project. Set up Tailwind CSS correctly and make sure the configuration is compatible with the installed version.

#### What I got

I faced an error because my project had a newer version of Tailwind CSS (`tailwindcss@4.3.3`), while the configuration was using the older Tailwind CSS/PostCSS setup.

#### What I corrected

I checked the Tailwind CSS version and updated the configuration to use the correct setup for Tailwind CSS v4. I also changed the Vite configuration and removed the old PostCSS Tailwind configuration that was causing the error.

## Pipeline Stage History Bug

While testing the candidate pipeline, I found a problem in the stage-change history.

When an application is advanced, the old stage was being replaced before creating the timeline event. Because of this, the timeline could record the same value for both `from_stage` and `to_stage`.

For example:

- Old stage: `applied`
- New stage: `screening`

The timeline must record:

`from_stage: applied`
`to_stage: screening`

Please fix the pipeline stage-change logic so that the old stage is stored before updating the application stage. Then use the stored old stage and the new stage when creating the timeline event.

Also verify that this does not break the existing pipeline rules or the immutable application timeline. 

## Dashboard Runtime Error

### Prompt
Fix the dashboard page. After login, the dashboard initially loads partially and then becomes a blank white page. Check the frontend and backend dashboard response and make sure the frontend uses the correct response fields without changing the existing backend functionality.

### What I Got
The browser console showed:
- `Cannot read properties of undefined (reading 'openPositions')`
- `Maximum update depth exceeded`

The dashboard frontend was expecting fields such as `headline.openPositions`, `headline.activeApplications`, `headline.interviewsThisWeek`, `applicationsByJob`, `applicationsByStage`, and `weeklyApplications`.

However, the backend dashboard API returns the data under `metrics`, `by_job`, `by_stage`, and `weekly_trend`.

### What I Corrected
Updated the dashboard frontend to use the actual backend response structure:

- `metrics.open_positions` → Open Positions
- `metrics.active_applications` → Active Applications
- `metrics.interviews_scheduled` → Interviews This Week
- `metrics.hires_this_month` → Hires This Month
- `by_stage` → Stage Chart
- `weekly_trend` → Weekly Trends Chart
- `by_job` → Job Breakdown Table

After the correction, the dashboard loads correctly without the blank white screen or the `openPositions` undefined error.

### Prompt
Fix date display issues and the blank page when clicking "View" on an application. Ensure the frontend uses the backend's actual field names and handles dates safely.

### What I got
- Job/Application pages showed **Invalid Date**.
- Clicking **View** opened a blank page.
- Console showed `RangeError: Invalid time value` in `TimelineHistory.jsx`.

### What I corrected
- Changed `createdAt` → `created_at`.
- Changed old application/timeline fields to the backend fields.
- Updated timeline handling to use `event_type`, `actor_name`, and parsed `details`.
- Added safe date validation to prevent page crashes.
- Fixed feedback payload to use `comments`.

### Result
Dates display correctly and the **View Application** page loads without crashing.


**## Active Duplicate Application Rule**

**### Prompt**

Add a server-side business rule for duplicate active applications.

For the same candidate and the same job opening, only one active application should exist at a time.

If a candidate already has an active application for a job opening, prevent creating another application for that same candidate and job.

Rejected applications should not block a new application for the same candidate and job, so a candidate can apply again after being rejected.

The same candidate should still be allowed to apply to different job openings.

Use candidate email and job opening ID to identify the application combination, and handle email comparison case-insensitively and with trimmed whitespace.

The rule must be enforced on the server, not only in the frontend.

Do not delete, modify, merge, or rewrite existing application or timeline data.

Also handle application updates so an application cannot be changed into a candidate/job combination that already has another active application. The current application must be excluded from its own duplicate check.

**### What I got**

The backend was updated to check for an existing active application before creating a new application.

When the same candidate tried to apply again for the same job while an existing application was active, the server returned HTTP 409 with the message:

\`This candidate already has an active application for this job opening.\`

Rejected applications did not block the candidate from applying again, and the same candidate could still apply to different job openings.

The update flow was also protected from creating another active application for the same candidate and job.

**### What I corrected**

While testing the rule, I identified an additional case where a candidate who was already hired for a job should receive a more specific message instead of the generic active-application message.

The server-side logic was updated so that:

\- Existing \`Applied\`, \`Screening\`, \`Interview\`, or \`Offer\` application → blocked as an active duplicate.

\- Existing \`Rejected\` application → new application allowed.

\- Existing \`Hired\` application → blocked with:

\`This candidate is already hired for this job opening.\`

The existing application history and rejected records were preserved.

**### Result**

The application flow now allows candidates to re-apply after rejection while preventing multiple active applications for the same job opening, and already-hired candidates receive a specific server-side validation message.

**## Interview Scheduling and Dashboard Metric**

**### Prompt**

Implement interview scheduling for assigned interviewers so that an application can have a scheduled interview date and time.

The interview scheduling information must be stored in the backend and returned through the application API.

Update the relevant frontend and backend flow so that when a recruiter assigns an interviewer to an application, they can also specify the interview date and time.

Do not change the existing interviewer assignment rules, application pipeline, permissions, timeline behavior, or other functionality.

Also update the dashboard so that "Interviews This Week" counts applications with interviews actually scheduled during the current calendar week rather than simply counting applications whose pipeline stage is "Interview".

**### What I got**

The initial dashboard implementation counted all active applications currently in the \`Interview\` stage as "Interviews This Week".

This was incorrect because being in the \`Interview\` stage does not necessarily mean that an interview has been scheduled.

For example:

\- Candidate in \`Interview\` stage but with no scheduled interview → should not count.

\- Candidate in \`Interview\` stage with an interview scheduled this week → should count.

**### What I corrected**

Added interview scheduling support to the application flow.

\- Added \`scheduled\_at\` to the interview panel data.

\- Updated interviewer assignment so a recruiter can provide an interview date and time.

\- Updated the backend application response to include the scheduled interview information.

\- Updated the application details UI to allow scheduling when assigning an interviewer.

\- Updated the dashboard calculation to count scheduled interviews that fall within the current calendar week instead of counting every application in the \`Interview\` stage.

The existing interviewer assignment and role-based permissions were preserved.

**### Result**

Interview scheduling is now stored and displayed as part of the application, and the dashboard's **Interviews This Week** metric reflects actually scheduled interviews rather than simply counting applications in the \`Interview\` stage.


**## Archived Job Filter Issue**

**### Prompt**

Fix the Job Openings archive filter behavior.

When the "Show archived jobs" checkbox is unchecked, the Job Openings page should show only active job openings with status \`open\` or \`closed\`.

When the checkbox is checked, the page should show only job openings with status \`archived\`.

The archived filter must be applied through the backend/API query rather than filtering all jobs only in the frontend.

Do not change job creation, editing, archiving, restoration, or application data.

**### What I got**

When the archive checkbox was selected, the Job Openings page was displaying a mixture of:

\- Open jobs

\- Closed jobs

\- Archived jobs

Instead of displaying only archived jobs.

The existing filter behavior was not correctly communicating the desired status to the backend.

**### What I corrected**

Updated the frontend to send the appropriate status filter to the Jobs API:

\- Archive checkbox unchecked → request active jobs using \`status=active\`.

\- Archive checkbox checked → request archived jobs using \`status=archived\`.

The backend maps:

\`status=active\` → \`open\` and \`closed\` jobs.

\`status=archived\` → only \`archived\` jobs.

The existing create, edit, archive, and restore functionality was preserved.

**### Result**

The Job Openings page now correctly displays:

\- **Unchecked:** Open + Closed jobs only.

\- **Checked:** Archived jobs only.

Applications belonging to archived jobs remain preserved.


## CSV Export — Hired Applications Missing

### Prompt
Update the CSV export functionality.

The requirement is to export every open application along with its current stage as a CSV file. During testing, applications whose current stage was `hired` were not appearing in the exported CSV.

Review the existing CSV export logic and ensure that open applications are exported regardless of whether their current stage is `applied`, `screening`, `interview`, `offer`, or `hired`.

The export should use the application's actual `stage` value from the database. Do not create dummy hired applications, modify existing application records, change pipeline rules, or affect unrelated functionality.

Keep the existing CSV structure and ensure the `Current Stage` column correctly displays `hired` for applications that are actually in the hired stage.

### What I Got
The CSV export correctly included applications from the earlier pipeline stages, but an application in the `hired` stage was not included in the exported data.

### What I Corrected
The CSV export filtering logic was updated so that valid open applications in the `hired` stage are included along with applications in `applied`, `screening`, `interview`, and `offer`.

The `Current Stage` field is taken directly from the application's actual stage instead of assuming that only earlier pipeline stages should be exported.

### Result
The CSV export now includes every valid open application, including applications currently in the `hired` stage, while preserving the existing CSV format and application data.


## Bulk Application Action Request Mismatch

### Prompt
Fix the bulk application action functionality.

The frontend bulk advance and bulk reject actions are not working correctly because the request payload field used by the frontend does not match the field expected by the backend.

Inspect both the frontend service/component and backend pipeline endpoints. Make sure both bulk actions consistently use `application_ids` as the request field.

Do not change the existing bulk action behavior, validation, per-application success/refusal response, or unrelated functionality.

### What I Got
The bulk action request was being rejected because the frontend and backend were using different names for the application ID array.

### What I Corrected
The frontend bulk action requests were updated to send `application_ids`, matching the backend API.

### Result
Bulk advance and bulk reject now send the correct payload and work with the backend while preserving the per-application result handling.


## Timeline — Invalid Feedback Events

### Prompt
Fix the application timeline so that interviewer feedback events are only created when actual feedback is submitted.

Do not create placeholder or empty feedback timeline entries when an interviewer is assigned. Assignment and feedback must remain separate event types.

Reject empty feedback submissions at the API level and ensure valid feedback is recorded as an immutable timeline event.

Do not modify existing timeline immutability protections or unrelated functionality.

### What I Got
An interviewer assignment was creating an incorrect feedback timeline entry even when no feedback comments had been provided.

### What I Corrected
The assignment flow was separated from the feedback flow. Interviewer assignment now creates its appropriate assignment event, while feedback events are created only when actual feedback is submitted. Empty feedback submissions are rejected.

### Result
The timeline now accurately represents application activity without fake or empty feedback records.



## Candidate Name Validation

### prompt
Add validation so that candidate names cannot contain numbers or alphanumeric combinations. Allow letters, spaces, hyphens, and apostrophes. Apply the validation on both frontend and backend.

### What I Got
The Candidate Name field accepted values such as `123` and `Aman123`.

### What I Corrected
Added validation on both frontend and backend to reject numeric and alphanumeric names while allowing normal name formats.

### Result
Candidate names now accept valid name formats and reject values containing numbers.