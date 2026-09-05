# AI Prompts

Log of AI prompts used during development, grouped by milestone and detailing what was requested, what was produced, and the corrections applied.

---

## 1. Initial Workspace & Directory Organization

### Prompt
> "create wi folder under the inner folder takegome-03-hiring-pipeline"

### What you got
The AI interpreted the literal text and prepared to create a directory named `wi` under the inner repository path.

### What you corrected
The prompt contained a typographical ambiguity. The user corrected the instruction: *"i mean one folder is backend and ohter folder is frontend"*. The project structure was corrected to create dedicated `backend/` and `client/` directories, establishing a clean separation of concerns.

---

## 2. Phased Architectural Sequencing

### Prompt
> "move to frontend folder next after backend folder"

### What you got
The AI generated a full architectural implementation plan focusing on the backend first, mapping out the 10 core requirements:
1. Role-based access control (Recruiter vs Interviewer).
2. Job openings management (with soft archiving).
3. Applications inside job openings.
4. Strict stage progression (`Applied → Screening → Interview → Offer → Hired`), rejection, and exact reinstatement.
5. Interview panel assignment & restricted interviewer visibility.
6. Server-side search, filtering, sorting, and pagination.
7. Bulk advance / bulk reject with detailed per-candidate outcome reporting, plus CSV export.
8. Dashboard metrics, stage breakdowns, and 12-week quarterly trend charts.
9. Append-only immutable audit timeline enforced with database triggers.
10. Stalled application alerts (>10 days) with stage-aware dismissal return behavior.

### What you corrected
Ensured the backend did not simply rely on HTTP-level omissions for audit immutability, but implemented native SQLite triggers to guarantee Goal 9 compliance. Updated the plan to reflect `client/` workspace for the subsequent frontend phase.
