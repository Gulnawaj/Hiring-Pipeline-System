import dotenv from 'dotenv';
import { app } from '../src/app.js';
import { connectDB } from '../src/db/database.js';

dotenv.config();

// Vercel serverless handler
export default async function handler(req, res) {
  // Ensure database is connected before handling the request
  await connectDB();
  
  // Let Express handle the request
  return app(req, res);
}
