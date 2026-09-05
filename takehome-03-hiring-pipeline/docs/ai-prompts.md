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
