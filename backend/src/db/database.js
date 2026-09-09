import dns from "dns";
import mongoose from 'mongoose';
dns.setServers(["8.8.8.8", "1.1.1.1"]);

let cachedConnection = null;

export async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    cachedConnection = await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB Atlas');
    return cachedConnection;
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    throw error;
  }
}
