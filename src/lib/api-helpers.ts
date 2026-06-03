import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth';
import { ZodError } from 'zod';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function ok<T>(data: T, meta?: PaginationMeta, status = 200): NextResponse {
  return NextResponse.json({ success: true, data, error: null, ...(meta ? { meta } : {}) }, { status });
}

export function created<T>(data: T): NextResponse {
  return ok(data, undefined, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  return ok(items, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  });
}

// Central error handler — call in every route's catch block
export function handleError(error: unknown): NextResponse {
  if (error instanceof AuthError) return err(error.message, error.status);
  if (error instanceof ZodError)  return err(error.errors[0].message, 422);
  if (error instanceof Error)     return err(error.message, 500);
  return err('An unexpected error occurred', 500);
}

// Parse page/limit query params with safe defaults
export function parsePagination(url: URL, defaultLimit = 50) {
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') ?? String(defaultLimit), 10)));
  return { page, limit, skip: (page - 1) * limit };
}
