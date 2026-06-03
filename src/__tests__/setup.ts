// Global test setup — mock Prisma so unit tests don't need a real DB
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user:              { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
    refreshToken:      { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    emailVerification: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    passwordReset:     { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    file:              { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    folder:            { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    workspace:         { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    workspaceMember:   { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    notification:      { findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    cloudAddon:        { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    subscription:      { upsert: vi.fn(), updateMany: vi.fn() },
    invoice:           { create: vi.fn() },
    $transaction:      vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

// Silence console.error in tests
vi.spyOn(console, 'error').mockImplementation(() => {});
