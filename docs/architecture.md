# Architecture

### 1. What are the moving pieces, and how do they talk to each other?

The system follows a client-server architecture:

1. **Client (`client/`)**: A React.js single-page application built with Tailwind CSS, JavaScript/JSX, and Vite. It provides different interfaces for recruiters and interviewers and communicates with the backend through REST APIs.

2. **Backend (`backend/`)**: A Node.js and Express.js API written in JavaScript. It handles authentication, role-based access, application and pipeline rules, and other business logic.

3. **Database**: MongoDB Atlas stores users, jobs, applications, interview assignments, and application timeline data. Mongoose is used to interact with MongoDB.

4. **Communication**: The frontend and backend communicate through HTTP requests using JSON. JWT tokens are used to authenticate users, and the CSV export is returned as a downloadable file.

---

### 2. Where does each piece run?

- **Development**:
  - Backend runs on `http://localhost:4000` using the Node.js runtime.
  - Client runs locally on `http://localhost:3000`.
  - Database connects to MongoDB Atlas using environment variables.

- **Production Deployment**:
  - Frontend is deployed as a separate Vercel project.
  - Backend API is deployed as a separate Vercel project.
  - Database is hosted on MongoDB Atlas.

---

### 3. What is the request path for one representative user action, end to end?

**Representative Action: Recruiter moves an application from Screening to Interview**

1. **User Action**: The recruiter clicks the button to advance a candidate to the next stage.

2. **Frontend Request**: The React frontend sends a `POST` request to the backend pipeline API with the application's ID and the user's JWT token.

3. **Authentication**: The backend verifies the JWT token and identifies the logged-in user.

4. **Authorization**: The backend checks that the user has the recruiter role required to change an application's stage.

5. **Business Logic**: The controller checks the application's current stage and verifies that moving from `Screening` to `Interview` is a valid next step.

6. **Database Update**: Mongoose updates the application in MongoDB Atlas, changes the stage to `Interview`, and updates the stage entry time.

7. **Timeline Entry**: A timeline record is created to record the stage change and the user who performed it.

8. **Response**: The backend sends the updated application data back to the frontend as a JSON response.

9. **UI Update**: The React frontend updates the application stage and refreshes the relevant application and timeline information.

---

### 4. What did you decide not to build, and why?

- **Did NOT build advanced interview-management features**: The project supports assigning interviewers and scheduling interviews, but I did not build a full calendar system, recurring interviews, calendar integrations, or automated meeting links because these were outside the assignment scope.

- **Did NOT build WebSockets or real-time notifications**: The required alerts can be handled through normal API requests, so real-time communication would add complexity without being necessary for the assignment.
