/**
 * Prisma client singleton.
 * Uses dynamic require so the build succeeds before @prisma/client is installed.
 * Once installed (npm install && npx prisma generate), the real client is used.
 */
import type { PrismaLike } from '@/types/prisma-shim';

let _prisma: PrismaLike;

try {
  const g = globalThis as Record<string, unknown>;
  if (!g['prisma']) {
    const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (o?: unknown) => PrismaLike };
    g['prisma'] = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  _prisma = g['prisma'] as PrismaLike;
} catch {
  const notReady = () => {
    throw new Error(
      'Database unavailable. Run: npm install && npx prisma generate && npx prisma db push'
    );
  };
  _prisma = new Proxy({} as PrismaLike, {
    get: (_t: PrismaLike, prop: string) =>
      prop === '$transaction'
        ? (ops: Promise<unknown>[]) => Promise.all(ops)
        : new Proxy(notReady, { get: () => notReady }),
  });
}

export const prisma: PrismaLike = _prisma;
