import { PrismaClient } from '@prisma/client';

// Standard Next.js singleton pattern to avoid exhausting connections
// during dev hot-reload. Import `prisma` from here once you cut API
// routes over from the mock data layer to Postgres.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
