import * as Minio from 'minio';
import { env } from './env';
import { logger } from '../utils/logger';

let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      region: env.MINIO_REGION,
    });
  }
  return minioClient;
}

export async function initializeMinio(): Promise<void> {
  const client = getMinioClient();
  const bucket = env.MINIO_BUCKET;

  try {
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      await client.makeBucket(bucket, env.MINIO_REGION);
      logger.info(`MinIO bucket '${bucket}' created`);

      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucket}/*`,
          },
        ],
      });
      await client.setBucketPolicy(bucket, policy);
      logger.info(`MinIO bucket '${bucket}' policy set to private`);
    } else {
      logger.info(`MinIO bucket '${bucket}' already exists`);
    }
  } catch (error) {
    logger.error('Failed to initialize MinIO', { error });
    throw error;
  }
}

export async function checkMinioHealth(): Promise<boolean> {
  try {
    await getMinioClient().listBuckets();
    return true;
  } catch {
    return false;
  }
}

export async function generatePresignedUrl(
  objectPath: string,
  expirySeconds = 3600,
  bucket = env.MINIO_BUCKET
): Promise<string> {
  return getMinioClient().presignedGetObject(bucket, objectPath, expirySeconds);
}

export async function generateUploadPresignedUrl(
  objectPath: string,
  expirySeconds = 3600,
  bucket = env.MINIO_BUCKET
): Promise<string> {
  return getMinioClient().presignedPutObject(bucket, objectPath, expirySeconds);
}

export async function uploadBuffer(
  objectPath: string,
  buffer: Buffer,
  mimeType: string,
  metadata: Record<string, string> = {},
  bucket = env.MINIO_BUCKET
): Promise<void> {
  await getMinioClient().putObject(bucket, objectPath, buffer, buffer.length, {
    'Content-Type': mimeType,
    ...metadata,
  });
}

export async function deleteObject(objectPath: string, bucket = env.MINIO_BUCKET): Promise<void> {
  await getMinioClient().removeObject(bucket, objectPath);
}

export async function deleteObjects(objectPaths: string[], bucket = env.MINIO_BUCKET): Promise<void> {
  const objectsList = objectPaths.map((name) => ({ name }));
  await new Promise<void>((resolve, reject) => {
    const stream = getMinioClient().removeObjects(bucket, objectsList);
    stream.on('error', reject);
    stream.on('finish', resolve);
  });
}

export async function getObjectBuffer(objectPath: string, bucket = env.MINIO_BUCKET): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    getMinioClient().getObject(bucket, objectPath, (err, dataStream) => {
      if (err) return reject(err);
      dataStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      dataStream.on('end', () => resolve(Buffer.concat(chunks)));
      dataStream.on('error', reject);
    });
  });
}

export async function objectExists(objectPath: string, bucket = env.MINIO_BUCKET): Promise<boolean> {
  try {
    await getMinioClient().statObject(bucket, objectPath);
    return true;
  } catch {
    return false;
  }
}

export function buildObjectPath(userId: string, filename: string, prefix = 'files'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}/${year}/${month}/${userId}/${Date.now()}_${filename}`;
}
