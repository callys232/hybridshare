import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws a clear error on any query
    // so the app starts without crashing, but DB calls fail descriptively.
    const notReady = () => { throw new Error('DATABASE_URL is not set. Add it to .env.local and run: npx prisma db push'); };
    return new Proxy({} as PrismaClient, {
      get: (_t, prop: string) => {
        if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve();
        if (prop === '$transaction') return (ops: Promise<unknown>[]) => Promise.all(ops);
        return new Proxy(notReady, { get: () => notReady });
      },
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = createClient());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
