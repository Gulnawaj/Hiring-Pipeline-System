# Decisions

Log of the architectural and technical decisions that shaped this codebase.

---

## Decision 1: Database & Data Persistence

- **Chose:** MongoDB Atlas with Mongoose.

- **Rejected:** SQLite/local database files and a separate relational database service.

- **Why:** The application manages users, job openings, applications, interviewer assignments, and timeline events that fit naturally into MongoDB documents and collections. MongoDB Atlas also provides a managed database for deployment, while Mongoose provides schemas, validation, and a consistent way for the backend to interact with the database.


## Decision 2: Client-Server Architecture

- **Chose:** A separate React.js client and Node.js/Express backend communicating through REST APIs.

- **Rejected:** Combining the frontend and backend into a single server-rendered application.

- **Why:** Separating the client and backend keeps responsibilities clear. The React frontend focuses on the user interface, while the Express backend handles authentication, authorization, business rules, database operations, and API responses. This also allows the frontend and backend to be deployed as separate Vercel projects.

---

## Decision 3: Backend Controller Structure

- **Chose:** Separate controllers for major backend areas such as authentication, jobs, applications, pipeline operations, dashboard, alerts, exports, and timeline operations.

- **Rejected:** Keeping all request-handling and business logic directly inside route files.

- **Why:** Moving business logic into controllers keeps routes focused on defining endpoints and middleware. It makes the backend easier to understand, maintain, and extend without changing the API structure.

---

## Decision 4: Separate Deployment on Vercel

- **Chose:** Deploy the React frontend and Node.js/Express backend as separate Vercel projects, with MongoDB Atlas as the production database.

- **Rejected:** Hosting the frontend and backend as a single deployment.

- **Why:** The frontend and backend have different responsibilities and build/runtime requirements. Separate Vercel projects keep the deployments independent while allowing the frontend to communicate with the backend through the configured API URL and environment variables.


## Decision 5: Server-Side Application Filtering and Pagination

- **Chose:** Perform application search, filtering, sorting, and pagination on the backend.

- **Rejected:** Loading all applications into the browser and filtering them only on the frontend.

- **Why:** Goal 6 requires server-side search and pagination. Keeping these operations on the backend reduces unnecessary data transfer and ensures that the API returns only the records needed for the current page and filters.

### Decision 9: Prevent Duplicate Active Applications

- **Chose:** Allow only one active application for the same candidate and job opening at a time.

- **Rejected:** Allowing unlimited active applications for the same candidate and job.

- **Why:** Multiple historical rejected applications are still preserved, but allowing multiple active applications for the same candidate and opening could create ambiguity in the hiring pipeline. The rule prevents duplicate active records while still allowing the candidate to reapply after rejection.

### Decision 7: Authentication Approach

- **Chose:** JWT-based authentication with role information used for recruiter and interviewer access control.

- **Rejected:** Maintaining login state only in the frontend or relying on client-side role checks.

- **Why:** Authentication and authorization must be enforced on the server. JWT allows the backend to identify the authenticated user on each request, while backend role checks prevent users from accessing operations they are not allowed to perform.


### Decision 8: Interviewer Assignment Model

- **Chose:** Store interviewer assignments separately so an application can have multiple interviewers.

- **Rejected:** Storing only one interviewer ID directly on the application.

- **Why:** The requirements allow any number of interviewers to be assigned to an application. A separate assignment model also makes it possible for the same interviewer to be assigned to multiple applications.



### Decision 9: Interview Scheduling Independent of Pipeline Stage

- **Chose:** Allow recruiters to schedule an interview for an application regardless of its current pipeline stage.

- **Rejected:** Restricting interview scheduling to applications only when they reach the `interview` stage.

- **Why:** Interview scheduling and pipeline progression are treated as separate pieces of information. A recruiter may schedule an upcoming interview while an application is still in `applied` or `screening`. The dashboard therefore determines **“Interviews This Week”** using the interview's `scheduled_at` date rather than the application's current pipeline stage.