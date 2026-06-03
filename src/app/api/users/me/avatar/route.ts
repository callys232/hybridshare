import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { uploadFile, resolveProvider } from '@/lib/storage';
import { ok, err, handleError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;
    if (!file) return err('No file provided', 400);

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) return err('Invalid image type', 400);
    if (file.size > 5 * 1024 * 1024) return err('Image must be under 5 MB', 400);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: sub }, select: { cloudAddon: true } });
    const provider = resolveProvider(!!user.cloudAddon?.isEnabled);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storagePath, cloudUrl } = await uploadFile(buffer, `avatar-${sub}.${file.type.split('/')[1]}`, file.type, provider, sub);

    const avatar = cloudUrl ?? `/api/uploads/${storagePath}`;
    await prisma.user.update({ where: { id: sub }, data: { avatar } });

    return ok({ avatar });
  } catch (e) {
    return handleError(e);
  }
}
