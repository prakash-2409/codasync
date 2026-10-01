const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/placement_dashboard';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500 // Fast failover to in-memory if local mongod is not active
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to primary MongoDB at ${uri}: ${error.message}`);
    console.log('[Database] Initializing fallback in-memory database for seamless local execution...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const fallbackUri = mongod.getUri();
      const conn = await mongoose.connect(fallbackUri);
      console.log(`[Database] In-Memory MongoDB Connected at ${fallbackUri}`);
    } catch (memErr) {
      console.error('[Database Fatal Error] Failed to initialize fallback database:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
