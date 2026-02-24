import mongoose from 'mongoose';

// Cache the connection for serverless environments
let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  // If already connected, skip
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('📊 Using existing MongoDB connection');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

  if (!mongoUri) {
    const error = new Error('MONGODB_URI environment variable is not set');
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }

  // Check for localhost MongoDB on Vercel (common misconfiguration)
  if (isVercel && (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1'))) {
    const error = new Error(
      'MONGODB_URI is set to localhost but running on Vercel. ' +
      'Please update MONGODB_URI in Vercel Environment Variables to use MongoDB Atlas: ' +
      'mongodb+srv://username:password@cluster.mongodb.net/mestory'
    );
    console.error('❌ MongoDB configuration error:', error.message);
    throw error;
  }

  // Debug logging (hide sensitive parts of URI)
  const uriParts = mongoUri.split('@');
  const safeUri = uriParts.length > 1 ? `***@${uriParts[1]}` : 'mongodb://***';
  console.log(`🔌 Connecting to MongoDB: ${safeUri}`);

  try {
    // Configure mongoose for serverless
    mongoose.set('bufferCommands', false);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 1, // Minimum connections
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
  } catch (error: any) {
    isConnected = false;
    console.error('❌ MongoDB connection error:', error.message);
    console.error('❌ Full error:', error);
    throw error;
  }
};

// Get connection status for health checks
export const getDatabaseStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
});

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});
