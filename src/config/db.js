import { PrismaClient } from '../generated/prisma/index.js';

let prisma;

export const connectToDB = async () => {
  try {
    if (!prisma) {
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'minimal',
      });
    }

    // Connect to the database
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database successfully');
    
    return prisma;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }
};

export const disconnectFromDB = async () => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      console.log('✅ Disconnected from database');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error.message);
  }
};

export const getPrismaClient = () => {
  if (!prisma) {
    throw new Error('Database not connected. Call connectToDB() first.');
  }
  return prisma;
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️ Received SIGINT. Shutting down gracefully...');
  await disconnectFromDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Received SIGTERM. Shutting down gracefully...');
  await disconnectFromDB();
  process.exit(0);
});