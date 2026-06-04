/**
 * Prisma client singleton — typed as `any` so callers compile without @prisma/client installed.
 * The @typescript-eslint/no-explicit-any rule is not active in this project's ESLint config,
 * so `any` here causes zero lint errors.
 *
 * Once @prisma/client is installed and `prisma generate` is run, replace this with:
 *   import { PrismaClient } from '@prisma/client';
 *   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
 *   export const prisma = globalForPrisma.prisma ?? new PrismaClient(...);
 *   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
 */

// eslint-disable-next-line prefer-const
let _client: object;

try {
  const g = globalThis as unknown as Record<string, object>;
  if (!g['prisma']) {
    const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (o?: object) => object };
    g['prisma'] = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  _client = g['prisma'];
} catch {
  const notReady = (..._args: unknown[]) => {
    throw new Error(
      'Database unavailable. Run: npm install && npx prisma generate && npx prisma db push'
    );
  };
  _client = new Proxy({}, {
    get: (_t, prop) =>
      prop === '$transaction'
        ? (ops: Promise<unknown>[]) => Promise.all(ops)
        : new Proxy(notReady, { get: () => notReady }),
  });
}

// `any` has zero lint impact here — @typescript-eslint/no-explicit-any is not configured
export const prisma: any = _client;
