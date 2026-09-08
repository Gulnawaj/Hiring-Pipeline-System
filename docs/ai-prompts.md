# AI Prompts

## Database Connection Problem

### Prompt
My MERN backend is not connecting to MongoDB Atlas. I am getting the error `MongoInvalidArgumentError: Database names cannot contain the character '.'`. Please help me fix the MongoDB connection.

### What you got
The MongoDB connection was failing because of a problem with the connection setup.

### What you corrected
I updated `database.js` with the required DNS configuration. After restarting the server, MongoDB connected successfully.
---

## Frontend Architecture and Implementation

### Prompt

Build the frontend for the Hiring Pipeline project using React.js and Tailwind CSS strictly. 
First inspect the existing backend APIs and then create the necessary frontend pages, components, 
API files, authentication, role-based UI, application pipeline, dashboard, alerts, interview panel, 
search/filtering, pagination, bulk actions, CSV export, and application timeline required to satisfy 
all 10 assignment goals.

Do not modify the existing backend logic or assignment requirements. Keep the frontend connected to 
the existing backend APIs and make the implementation simple, clean, responsive, and functional.

### What you got

The frontend architecture and required pages/components were created based on the 10 goals. 
The frontend was connected to the existing backend APIs and role-specific functionality was added 
for recruiters and interviewers.

### What you corrected

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