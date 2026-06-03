import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

// Dynamic imports keep route-level mocks working
async function getRegisterRoute() { return import('@/app/api/auth/register/route'); }
async function getLoginRoute()    { return import('@/app/api/auth/login/route');    }

function makeRequest(body: unknown, method = 'POST') {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Mock email + cookie helpers so no network calls in tests
vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail:      vi.fn().mockResolvedValue(undefined),
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set:    vi.fn(),
    delete: vi.fn(),
    get:    vi.fn(),
  })),
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with tokens on valid input', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com', name: 'Test', role: 'MEMBER', planType: 'FREE', isEmailVerified: false, storageQuota: BigInt(0), storageUsed: BigInt(0) };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.emailVerification.create).mockResolvedValue({} as never);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never);

    const { POST } = await getRegisterRoute();
    const res = await POST(makeRequest({ name: 'Test', email: 'test@example.com', password: 'Secure@123' }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
  });

  it('returns 409 when email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as never);

    const { POST } = await getRegisterRoute();
    const res = await POST(makeRequest({ name: 'Test', email: 'taken@example.com', password: 'Secure@123' }));
    expect(res.status).toBe(409);
  });

  it('returns 422 for a weak password', async () => {
    const { POST } = await getRegisterRoute();
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', password: 'weak' }));
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with tokens on valid credentials', async () => {
    const hash = await hashPassword('Correct@1');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: 'A', role: 'MEMBER', planType: 'FREE',
      passwordHash: hash, isActive: true, isTwoFactorEnabled: false,
      avatar: null, isEmailVerified: true, storageUsed: BigInt(0), storageQuota: BigInt(0),
    } as never);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const { POST } = await getLoginRoute();
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'Correct@1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.accessToken).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const hash = await hashPassword('Correct@1');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1', passwordHash: hash, isActive: true, isTwoFactorEnabled: false,
    } as never);

    const { POST } = await getLoginRoute();
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'Wrong@Pass1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
