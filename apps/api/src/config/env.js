"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    APP_URL: zod_1.z.string().url(),
    API_URL: zod_1.z.string().url().optional(),
    DATABASE_URL: zod_1.z.string(),
    DATABASE_POOL_MAX: zod_1.z.coerce.number().default(10),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    MINIO_ENDPOINT: zod_1.z.string().default('localhost'),
    MINIO_PORT: zod_1.z.coerce.number().default(9000),
    MINIO_USE_SSL: zod_1.z.coerce.boolean().default(false),
    MINIO_ACCESS_KEY: zod_1.z.string(),
    MINIO_SECRET_KEY: zod_1.z.string(),
    MINIO_BUCKET: zod_1.z.string().default('hybridshare'),
    MINIO_REGION: zod_1.z.string().default('us-east-1'),
    MEILISEARCH_HOST: zod_1.z.string().default('http://localhost:7700'),
    MEILISEARCH_API_KEY: zod_1.z.string().default('masterKey'),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    TOTP_ISSUER: zod_1.z.string().default('HybridShare'),
    AES_ENCRYPTION_KEY: zod_1.z.string().length(64),
    SMTP_HOST: zod_1.z.string(),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_SECURE: zod_1.z.coerce.boolean().default(false),
    SMTP_USER: zod_1.z.string(),
    SMTP_PASS: zod_1.z.string(),
    EMAIL_FROM: zod_1.z.string(),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_CALLBACK_URL: zod_1.z.string().optional(),
    MICROSOFT_CLIENT_ID: zod_1.z.string().optional(),
    MICROSOFT_CLIENT_SECRET: zod_1.z.string().optional(),
    MICROSOFT_TENANT_ID: zod_1.z.string().default('common'),
    MICROSOFT_CALLBACK_URL: zod_1.z.string().optional(),
    LDAP_URL: zod_1.z.string().optional(),
    LDAP_BIND_DN: zod_1.z.string().optional(),
    LDAP_BIND_CREDENTIALS: zod_1.z.string().optional(),
    LDAP_SEARCH_BASE: zod_1.z.string().optional(),
    LDAP_SEARCH_FILTER: zod_1.z.string().default('(sAMAccountName={{username}})'),
    ZERNIO_API_KEY: zod_1.z.string().optional(),
    ZERNIO_API_URL: zod_1.z.string().url().optional(),
    CLAMAV_SOCKET: zod_1.z.string().optional(),
    CLAMAV_HOST: zod_1.z.string().default('localhost'),
    CLAMAV_PORT: zod_1.z.coerce.number().default(3310),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    AUTH_RATE_LIMIT_MAX: zod_1.z.coerce.number().default(10),
    MAX_FILE_SIZE_MB: zod_1.z.coerce.number().default(500),
    ALLOWED_MIME_TYPES: zod_1.z.string().default('*'),
    CONNECTOR_SYNC_INTERVAL_MINUTES: zod_1.z.coerce.number().default(60),
    CONNECTOR_MAX_RETRIES: zod_1.z.coerce.number().default(3),
    // Stripe
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // Anthropic (Claude AI)
    ANTHROPIC_API_KEY: zod_1.z.string().optional(),
    // Video / Media
    BUNNY_CDN_API_KEY: zod_1.z.string().optional(),
    BUNNY_CDN_STORAGE_ZONE: zod_1.z.string().optional(),
    MUXDATA_TOKEN_ID: zod_1.z.string().optional(),
    MUXDATA_TOKEN_SECRET: zod_1.z.string().optional(),
    // Live Sessions
    ZOOM_API_KEY: zod_1.z.string().optional(),
    ZOOM_API_SECRET: zod_1.z.string().optional(),
    DAILY_CO_API_KEY: zod_1.z.string().optional(),
    // PDF Generation
    PUPPETEER_EXECUTABLE_PATH: zod_1.z.string().optional(),
    // LMS Settings
    LMS_BASE_URL: zod_1.z.string().url().optional(),
    CERTIFICATE_ISSUER: zod_1.z.string().default('HybridShare LMS'),
    MAX_UPLOAD_SIZE_MB: zod_1.z.coerce.number().default(500),
    SCORM_STORAGE_BUCKET: zod_1.z.string().default('hybridshare-scorm'),
});
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map