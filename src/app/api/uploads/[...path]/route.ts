import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { lookup } from 'mime-types';

type Ctx = { params: Promise<{ path: string[] }> };

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { path } = await ctx.params;
    const safePath = path.map((p) => p.replace(/\.\./g, '')).join('/');
    const filePath = join(UPLOAD_DIR, safePath);

    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const buffer = readFileSync(filePath);
    const mimeType = lookup(filePath) || 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':  mimeType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Length': String(buffer.length),
      },
    });
  } catch {
    return new NextResponse('Server error', { status: 500 });
  }
}
