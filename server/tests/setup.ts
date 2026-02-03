import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Test database setup
const prisma = new PrismaClient();

// Global test setup
beforeAll(async () => {
  // Clean up test database
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data
  await prisma.userAchievement.deleteMany();
  await prisma.userLevel.deleteMany();
  await prisma.gradingResult.deleteMany();
  await prisma.essay.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.user.deleteMany();
});
