# Architecture

### 1. What are the moving pieces, and how do they talk to each other?

The system is structured as a decoupled, modern client-server architecture:
- **Client (`client/`)**: Single-Page Application (SPA) providing role-tailored workspaces for recruiters and interviewers. It interacts with the backend strictly via authenticated RESTful JSON HTTP endpoints.
- **Backend API (`backend/`)**: Node.js & Express service written in TypeScript. It handles JWT authentication, enforces role-based access control (RBAC), validates business logic rules (state transition graphs, bulk actions, stage-aware alert dismissals), and orchestrates database transactions.
- **Data Persistence Layer (`hiring_pipeline.db`)**: Embedded relational SQLite engine with WAL mode and foreign key constraints enabled. It guarantees data integrity and uses database triggers to enforce audit log immutability.
- **Communication Protocol**: Stateless HTTP/1.1 with Bearer JWT headers and JSON payloads, with streaming support for CSV file exports.

---

### 2. Where does each piece run?

- **Development**:
  - Backend runs on `http://localhost:4000` via Node.js runtime.
  - Client runs locally on Vite dev server (e.g. `http://localhost:5173`).
  - Database runs as a local file (`backend/hiring_pipeline.db`).
- **Production Deployment**:
  - Browser-side client deployed to **Vercel** as static assets with global CDN caching.
  - Backend API deployed to **Render** or **Railway** as a containerized web service.
  - Database hosted via managed SQLite (Turso / Litestream) or PostgreSQL (Supabase) via environment variables.

---

### 3. What is the request path for one representative user action, end to end?

**Representative Action: Recruiter advances a candidate from Screening to Interview**
1. **User Interaction**: Recruiter clicks "Advance to Interview" on candidate Sophia Wang's detail page in the frontend client.
2. **HTTP Request**: Frontend issues `POST /api/pipeline/:id/advance` with `Authorization: Bearer <jwt_token>`.
3. **Authentication Middleware**: Express extracts and validates the JWT secret and decodes user identity (`req.user = { id, role: 'recruiter', ... }`).
4. **Role Authorization Middleware**: `requireRecruiter` checks `req.user.role === 'recruiter'`. If non-recruiter, responds with `403 Forbidden`.
5. **Domain Validation**:
   - Backend queries current application state: verifies applicant exists, is not marked `is_rejected = 1`, and stage is `screening`.
   - Computes expected next stage (`interview`).
6. **Persistence & Audit Write**:
   - Updates `applications` table: sets `stage = 'interview'`, resets `stage_entered_at = now()` (resetting the 10-day stalled clock for the new stage), and updates `updated_at = now()`.
   - Inserts immutable event into `application_timeline`: `{ event_type: 'stage_change', from_stage: 'screening', to_stage: 'interview', actor_id: recruiterId, actor_name: 'Rachel Adams' }`.
7. **Response**: Backend responds with HTTP `200 OK` and updated application record.
8. **UI State Update**: Frontend updates the candidate's stage badge, refreshes the timeline feed, and updates the stalled alert counter in the header.

---

### 4. What did you decide *not* to build, and why?

- **Did NOT build complex microservices**: Kept backend as a clean, cohesive modular monolith. A hiring pipeline has strongly coupled relational transactions (e.g. updating candidate stage must atomically write an audit record); separating into microservices would introduce distributed transaction complexity (Sagas, eventual consistency) with zero business benefit.
- **Did NOT build WebSockets for live alerts**: Goal 10 requires alert badges and counters. Polling on route transitions or lightweight revalidation provides simplicity, high reliability, and zero persistent socket connection overhead on free-tier hosting.
- **Did NOT build arbitrary stage jumping in the UI**: Even though recruiters might conceptually want a "jump to offer" shortcut, we intentionally enforced the strict single-step pipeline required by Goal 4 to prevent accidental stage skipping and enforce process hygiene.
