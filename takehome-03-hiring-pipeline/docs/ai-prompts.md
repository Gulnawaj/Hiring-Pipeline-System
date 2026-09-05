# AI Prompts

## Database Connection Problem

### Prompt
My MERN backend is not connecting to MongoDB Atlas. I am getting the error `MongoInvalidArgumentError: Database names cannot contain the character '.'`. Please help me fix the MongoDB connection.

### What you got
The MongoDB connection was failing because of a problem with the connection setup.

### What you corrected
I updated `database.js` with the required DNS configuration. After restarting the server, MongoDB connected successfully.
---

