import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    console.log('⚠️  MONGODB_URI is not set. Running without MongoDB.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return true;

  } catch (error) {
    console.log(`⚠️  MongoDB unavailable: ${error.message}`);
    console.log('⚠️  Continuing startup without MongoDB. Query logging will be disabled.');
    return false;
  }
};

export const isMongoConnected = () => mongoose.connection.readyState === 1;

export default connectDB;
