import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url(),
  API_URL: z.string().url().optional(),

  DATABASE_URL: z.string(),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),

  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string().default('hybridshare'),
  MINIO_REGION: z.string().default('us-east-1'),

  MEILISEARCH_HOST: z.string().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: z.string().default('masterKey'),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  TOTP_ISSUER: z.string().default('HybridShare'),

  AES_ENCRYPTION_KEY: z.string().length(64),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().default('common'),
  MICROSOFT_CALLBACK_URL: z.string().optional(),

  LDAP_URL: z.string().optional(),
  LDAP_BIND_DN: z.string().optional(),
  LDAP_BIND_CREDENTIALS: z.string().optional(),
  LDAP_SEARCH_BASE: z.string().optional(),
  LDAP_SEARCH_FILTER: z.string().default('(sAMAccountName={{username}})'),

  ZERNIO_API_KEY: z.string().optional(),
  ZERNIO_API_URL: z.string().url().optional(),

  CLAMAV_SOCKET: z.string().optional(),
  CLAMAV_HOST: z.string().default('localhost'),
  CLAMAV_PORT: z.coerce.number().default(3310),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),

  MAX_FILE_SIZE_MB: z.coerce.number().default(500),
  ALLOWED_MIME_TYPES: z.string().default('*'),

  CONNECTOR_SYNC_INTERVAL_MINUTES: z.coerce.number().default(60),
  CONNECTOR_MAX_RETRIES: z.coerce.number().default(3),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Anthropic (Claude AI)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Video / Media
  BUNNY_CDN_API_KEY: z.string().optional(),
  BUNNY_CDN_STORAGE_ZONE: z.string().optional(),
  MUXDATA_TOKEN_ID: z.string().optional(),
  MUXDATA_TOKEN_SECRET: z.string().optional(),

  // Live Sessions
  ZOOM_API_KEY: z.string().optional(),
  ZOOM_API_SECRET: z.string().optional(),
  DAILY_CO_API_KEY: z.string().optional(),

  // PDF Generation
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),

  // LMS Settings
  LMS_BASE_URL: z.string().url().optional(),
  CERTIFICATE_ISSUER: z.string().default('HybridShare LMS'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(500),
  SCORM_STORAGE_BUCKET: z.string().default('hybridshare-scorm'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
