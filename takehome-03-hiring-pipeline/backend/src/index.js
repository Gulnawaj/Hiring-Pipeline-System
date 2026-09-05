import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDB } from './db/database.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, async () => {
  console.log(`🚀 Hiring Pipeline Backend (MongoDB + Mongoose) running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);

  await connectDB();
});
