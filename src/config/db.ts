import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export const connectToDB = async (): Promise<void> => {
  try {
    if (!prisma) {
      prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Database not connected. Call connectToDB() first.');
  }
  return prisma;
};

export const disconnectDB = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('Database disconnected');
  }
};