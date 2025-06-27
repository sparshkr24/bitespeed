import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const connectToDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export { prisma, connectToDB };
