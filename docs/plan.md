# Plan

### 1. How did you break the work into sessions?

The project was divided into practical development sessions based on the dependencies between the requirements:

- **Session 1: Requirements Analysis & Data Modeling**
  - Broke down the 10 goals and identified the important business rules and edge cases.
  - Planned the MongoDB collections for users, job openings, applications, interview assignments, application timelines, and stalled-alert dismissals.
  - Defined the application pipeline and rejection/reinstatement behavior.

- **Session 2: Backend Foundation & Core Rules**
  - Set up the Node.js and Express backend.
  - Implemented JWT authentication and recruiter/interviewer role-based access control.
  - Built job, application, and pipeline APIs.
  - Added server-side validation for stage transitions, rejection/reinstatement, interviewer assignment, and other business rules.

- **Session 3: Backend Features & Dashboard**
  - Added server-side search, filtering, sorting, and pagination for applications.
  - Implemented bulk pipeline actions and CSV export.
  - Added interview scheduling and dashboard metrics.
  - Implemented stalled-application alerts and stage-specific alert dismissal.

- **Session 4: React Frontend & User Workflows**
  - Built the React/Vite frontend with Tailwind CSS.
  - Implemented recruiter and interviewer views.
  - Built job opening management, application management, pipeline controls, application details, interviewer assignment, interview scheduling, alerts, and dashboard screens.
  - Connected the frontend to the backend REST APIs.

- **Session 5: Testing, Debugging, Refactoring & Documentation**
  - Tested the workflows and edge cases across the 10 goals.
  - Fixed frontend/backend response mismatches, duplicate application handling, dashboard metric issues, CSV export issues, filtering issues, and timeline issues.
  - Refactored backend logic into controllers.
  - Updated architecture, decisions, AI prompts, submission, and deployment documentation.

---

### 2. What order did you build in, and why that order?

- **Order:**

  1. Requirements analysis and data model
  2. Authentication and role-based access control
  3. Core job and application APIs
  4. Pipeline rules, rejection/reinstatement, and timeline
  5. Search, filtering, pagination, bulk actions, and CSV export
  6. Interview assignment, scheduling, alerts, and dashboard
  7. React frontend and user workflows
  8. Testing, debugging, refactoring, and deployment preparation

- **Why that order?**

  I started with the backend because the core hiring rules need to be enforced on the server. Once authentication, authorization, application rules, pipeline transitions, and data models were working, the frontend could consume stable REST APIs.

  After the core workflow was in place, I added the supporting requirements such as search, pagination, bulk actions, exports, interview scheduling, alerts, and dashboard metrics. The final phase focused on integration testing, fixing issues found during testing, code organization, and documentation.

---

### 3. What did you estimate versus what it actually took?

- **Overall initial estimate:** Approximately 8–10 hours

- **Actual time:** Approximately 12–15 hours

- **Why it took longer:**
  - Some requirements required more edge-case handling than expected, especially pipeline transitions, rejection/reinstatement, immutable timeline behavior, stalled alerts, and duplicate applications.
  - Integration testing revealed several frontend/backend mismatches that required debugging and correction.
  - Additional time was spent on interview scheduling, dashboard calculations, CSV export behavior, backend refactoring, deployment preparation, and documentation.
  - I also spent time testing the application with realistic data instead of only checking the main happy paths.

---

### 4. What did you cut when you ran short?

I prioritized the required hiring workflow and backend rules over optional features.

The main goal was to complete and verify all required functionality before spending time on additional features.