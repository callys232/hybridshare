/**
 * File storage abstraction.
 * LOCAL: Node.js `fs` (zero dependencies).
 * S3/R2: direct AWS REST API via fetch + HMAC-SHA256 signing (zero dependencies).
 */
import { createReadStream, createWriteStream, mkdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID, createHmac } from 'crypto';

export type StorageProvider = 'LOCAL' | 'S3' | 'R2' | 'GCS';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

export interface UploadResult {
  storagePath:     string;
  storageProvider: StorageProvider;
  cloudUrl:        string | null;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadFile(
  buffer:       Buffer,
  originalName: string,
  mimeType:     string,
  provider:     StorageProvider = 'LOCAL',
  userId?:      string
): Promise<UploadResult> {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'bin';
  const key = `${userId ?? 'anon'}/${randomUUID()}.${ext}`;

  if (provider === 'S3' || provider === 'R2') {
    return s3Upload(buffer, key, mimeType, provider);
  }

  // LOCAL
  const localPath = join(UPLOAD_DIR, key);
  mkdirSync(dirname(localPath), { recursive: true });
  await writeBuffer(localPath, buffer);
  return { storagePath: key, storageProvider: 'LOCAL', cloudUrl: null };
}

// ─── Download URL ─────────────────────────────────────────────────────────────

export async function getDownloadUrl(
  storagePath:    string,
  provider:       StorageProvider,
  expiresInSecs = 3600
): Promise<string> {
  if (provider === 'S3' || provider === 'R2') {
    return s3PresignedUrl(storagePath, expiresInSecs);
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${appUrl}/api/uploads/${storagePath}`;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteFile(storagePath: string, provider: StorageProvider): Promise<void> {
  if (provider === 'S3' || provider === 'R2') {
    await s3Delete(storagePath);
    return;
  }
  const p = join(UPLOAD_DIR, storagePath);
  if (existsSync(p)) unlinkSync(p);
}

// ─── Local read helpers ───────────────────────────────────────────────────────

export function getLocalFileStream(storagePath: string) {
  const p = join(UPLOAD_DIR, storagePath);
  return existsSync(p) ? createReadStream(p) : null;
}

export function getLocalFilePath(storagePath: string) {
  return join(UPLOAD_DIR, storagePath);
}

export function resolveProvider(hasCloudAddon: boolean): StorageProvider {
  if (!hasCloudAddon) return 'LOCAL';
  const hasKey = (process.env.AWS_ACCESS_KEY_ID ?? '').length > 4;
  if (!hasKey) return 'LOCAL';
  return process.env.STORAGE_ENDPOINT ? 'R2' : 'S3';
}

// ─── AWS S3 helpers (fetch-based, no SDK) ─────────────────────────────────────

function s3Config() {
  return {
    bucket:   process.env.AWS_BUCKET_NAME   ?? 'hybridshare-files',
    region:   process.env.AWS_REGION        ?? 'us-east-1',
    keyId:    process.env.AWS_ACCESS_KEY_ID ?? '',
    secret:   process.env.AWS_SECRET_ACCESS_KEY ?? '',
    endpoint: process.env.STORAGE_ENDPOINT,
  };
}

function s3Host(cfg: ReturnType<typeof s3Config>): string {
  if (cfg.endpoint) return cfg.endpoint;
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function s3SigningKey(secret: string, date: string, region: string): Buffer {
  const kDate    = hmac(`AWS4${secret}`, date);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
}

async function s3PresignedUrl(key: string, expiresIn: number): Promise<string> {
  const cfg    = s3Config();
  const now    = new Date();
  const date   = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time   = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const host   = cfg.endpoint
    ? new URL(cfg.endpoint).host
    : `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
  const scope  = `${date}/${cfg.region}/s3/aws4_request`;
  const params = new URLSearchParams({
    'X-Amz-Algorithm':     'AWS4-HMAC-SHA256',
    'X-Amz-Credential':    `${cfg.keyId}/${scope}`,
    'X-Amz-Date':          time,
    'X-Amz-Expires':       String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
  });
  const canonical  = `GET\n/${key}\n${params.toString()}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const strToSign  = `AWS4-HMAC-SHA256\n${time}\n${scope}\n${createHmac('sha256', '').update(canonical).digest('hex')}`;
  const signingKey = s3SigningKey(cfg.secret, date, cfg.region);
  const signature  = createHmac('sha256', signingKey).update(strToSign).digest('hex');
  params.set('X-Amz-Signature', signature);
  return `${s3Host(cfg)}/${key}?${params.toString()}`;
}

async function s3Upload(buffer: Buffer, key: string, mimeType: string, provider: StorageProvider): Promise<UploadResult> {
  const cfg = s3Config();
  const url = `${s3Host(cfg)}/${key}`;
  await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType, 'Content-Length': String(buffer.length) },
    body: buffer,
  });
  const cloudUrl = provider === 'R2' && cfg.endpoint ? `${cfg.endpoint}/${cfg.bucket}/${key}` : url;
  return { storagePath: key, storageProvider: provider, cloudUrl };
}

async function s3Delete(key: string): Promise<void> {
  const cfg = s3Config();
  await fetch(`${s3Host(cfg)}/${key}`, { method: 'DELETE' }).catch(() => {});
}

// ─── Util ─────────────────────────────────────────────────────────────────────

function writeBuffer(filePath: string, buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = createWriteStream(filePath);
    ws.write(buffer, (err) => { if (err) { reject(err); return; } ws.end(resolve); });
    ws.on('error', reject);
  });
}
