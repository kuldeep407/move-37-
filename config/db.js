import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL Database');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}
