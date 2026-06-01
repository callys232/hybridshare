/**
 * security.middleware.ts
 *
 * Layered defensive middleware:
 *  1. Input sanitization (XSS, null bytes, oversized payloads)
 *  2. SQL / NoSQL injection pattern detection
 *  3. Path traversal & shell injection detection
 *  4. Suspicious User-Agent blocking
 *  5. API Key scope validation
 *  6. HMAC-signed webhook verification
 *  7. Request fingerprinting for anomaly detection
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// ─── Pattern libraries ────────────────────────────────────────────────────────

const SQL_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|truncate|cast|convert|declare|nchar|varchar|char|nvarchar)\b)/gi,
  /(\-\-|\/\*|\*\/|;|xp_|sp_|0x[0-9a-f]+)/gi,
  /(\bor\b\s+[\d'"].*=.*[\d'"]|\band\b\s+[\d'"].*=.*[\d'"])/gi,
  /'[\s]*or[\s]*'[\s]*=[\s]*'/gi,
];

const NOSQL_PATTERNS = [
  /\$where|\$gt|\$lt|\$ne|\$in|\$nin|\$regex|\$exists|\$eval/gi,
  /\{\s*"\$[a-z]+"/gi,
];

const PATH_TRAVERSAL = [
  /\.\.[\/\\]/g,
  /%2e%2e[%2f%5c]/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
];

const SHELL_INJECTION = [
  /[;&|`$><]/g,
  /\$\(.*\)/g,
  /`.*`/g,
  /\|.*\|/g,
];

const BAD_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /nmap/i,
  /dirbuster/i,
  /hydra/i,
  /burpsuite/i,
  /zgrab/i,
  /python-requests\/[01]\./i,  // very old python scrapers
];

const XSS_PATTERNS = [
  /<script[^>]*>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<svg.*onload/gi,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeString(val: string): string {
  return val
    .replace(/\0/g, '')                       // null bytes
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '') // control chars (keep \t \n \r)
    .trim();
}

function detectThreats(value: string, field: string): string | null {
  for (const p of SQL_PATTERNS) {
    if (p.test(value)) { p.lastIndex = 0; return `SQL injection pattern in field: ${field}`; }
    p.lastIndex = 0;
  }
  for (const p of NOSQL_PATTERNS) {
    if (p.test(value)) { p.lastIndex = 0; return `NoSQL injection pattern in field: ${field}`; }
    p.lastIndex = 0;
  }
  for (const p of XSS_PATTERNS) {
    if (p.test(value)) { p.lastIndex = 0; return `XSS pattern in field: ${field}`; }
    p.lastIndex = 0;
  }
  return null;
}

function scanObject(obj: unknown, depth = 0): string | null {
  if (depth > 10) return null; // prevent infinite recursion
  if (typeof obj === 'string') return detectThreats(obj, 'value');
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = scanObject(item, depth + 1);
      if (r) return r;
    }
  } else if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      // Check key names for NoSQL operator injection
      if (key.startsWith('$')) return `NoSQL operator key: ${key}`;
      const r = scanObject(val, depth + 1);
      if (r) return r;
    }
  }
  return null;
}

// ─── Middleware ────────────────────────────────────────────────────────────────

/**
 * Block known scanner user agents
 */
export function blockScanners(req: Request, res: Response, next: NextFunction): void {
  const ua = req.headers['user-agent'] ?? '';
  if (BAD_USER_AGENTS.some((p) => p.test(ua))) {
    logger.warn('Blocked scanner', { ip: req.ip, ua, path: req.path });
    res.status(403).json({ success: false, data: null, error: 'Forbidden' });
    return;
  }
  next();
}

/**
 * Detect path traversal in URL
 */
export function blockPathTraversal(req: Request, res: Response, next: NextFunction): void {
  const url = decodeURIComponent(req.originalUrl);
  for (const p of PATH_TRAVERSAL) {
    if (p.test(url)) {
      p.lastIndex = 0;
      logger.warn('Path traversal attempt', { ip: req.ip, url, path: req.path });
      res.status(400).json({ success: false, data: null, error: 'Invalid request path' });
      return;
    }
    p.lastIndex = 0;
  }
  next();
}

/**
 * Sanitize and validate all request inputs (body, query, params)
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction): void {
  // Scan body
  if (req.body && typeof req.body === 'object') {
    const threat = scanObject(req.body);
    if (threat) {
      logger.warn('Malicious body detected', { ip: req.ip, path: req.path, threat });
      res.status(400).json({ success: false, data: null, error: 'Invalid input detected' });
      return;
    }
  }

  // Scan query params
  if (req.query) {
    for (const [key, val] of Object.entries(req.query)) {
      if (typeof val === 'string') {
        const threat = detectThreats(val, `query.${key}`);
        if (threat) {
          logger.warn('Malicious query param', { ip: req.ip, path: req.path, threat });
          res.status(400).json({ success: false, data: null, error: 'Invalid query parameter' });
          return;
        }
      }
    }
  }

  // Scan params
  if (req.params) {
    for (const [key, val] of Object.entries(req.params)) {
      if (typeof val === 'string') {
        // Path traversal in params
        for (const p of PATH_TRAVERSAL) {
          if (p.test(val)) {
            p.lastIndex = 0;
            res.status(400).json({ success: false, data: null, error: 'Invalid path parameter' });
            return;
          }
          p.lastIndex = 0;
        }
        // Shell injection in params
        for (const p of SHELL_INJECTION) {
          if (p.test(val)) {
            p.lastIndex = 0;
            logger.warn('Shell injection in param', { ip: req.ip, key, val });
            res.status(400).json({ success: false, data: null, error: 'Invalid parameter format' });
            return;
          }
          p.lastIndex = 0;
        }
      }
    }
  }

  next();
}

/**
 * Enforce JSON Content-Type on POST/PUT/PATCH (unless multipart)
 */
export function enforceContentType(req: Request, res: Response, next: NextFunction): void {
  const methods = ['POST', 'PUT', 'PATCH'];
  if (methods.includes(req.method)) {
    const ct = req.headers['content-type'] ?? '';
    if (!ct.includes('application/json') && !ct.includes('multipart/form-data') && !ct.includes('application/x-www-form-urlencoded')) {
      res.status(415).json({ success: false, data: null, error: 'Unsupported Content-Type' });
      return;
    }
  }
  next();
}

/**
 * Validate HMAC signature on inbound Stripe webhooks.
 * The raw body must be captured before JSON parsing — use express.raw() on webhook routes.
 */
export function verifyStripeWebhook(req: Request, res: Response, next: NextFunction): void {
  // Signature verification is handled in payment.service.ts via stripe.webhooks.constructEvent
  // This middleware just ensures the raw body is present
  if (!req.body || !Buffer.isBuffer(req.body)) {
    res.status(400).json({ success: false, data: null, error: 'Missing raw body for webhook' });
    return;
  }
  next();
}

/**
 * Generic HMAC webhook signature verifier (for custom webhooks sent by HybridShare)
 */
export function verifyWebhookSignature(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sig = req.headers['x-hybridshare-signature'] as string;
    if (!sig) {
      res.status(401).json({ success: false, data: null, error: 'Missing webhook signature' });
      return;
    }
    try {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      const provided = sig.replace('sha256=', '');
      if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'))) {
        logger.warn('Webhook signature mismatch', { ip: req.ip });
        res.status(401).json({ success: false, data: null, error: 'Invalid webhook signature' });
        return;
      }
    } catch {
      res.status(400).json({ success: false, data: null, error: 'Signature verification failed' });
      return;
    }
    next();
  };
}

/**
 * API Key scope validator.
 * Usage: validateApiKeyScope('courses:read')
 */
export function validateApiKeyScope(requiredScope: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      res.status(401).json({ success: false, data: null, error: 'API key required' });
      return;
    }

    try {
      const { getPrisma } = await import('../config/database');
      const prisma = getPrisma();

      // Hash the key for lookup (keys stored hashed)
      const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const key = await prisma.aPIKey.findUnique({ where: { keyHash: hash } });

      if (!key || !key.isActive) {
        res.status(401).json({ success: false, data: null, error: 'Invalid or revoked API key' });
        return;
      }

      if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        res.status(401).json({ success: false, data: null, error: 'API key has expired' });
        return;
      }

      // Check scope — key scopes are stored as ['courses:read', 'enrollments:write', ...]
      const scopes = key.scopes as string[];
      const hasScope = scopes.includes(requiredScope) || scopes.includes('*') || scopes.includes(requiredScope.split(':')[0] + ':*');
      if (!hasScope) {
        logger.warn('API key scope denied', { keyId: key.id, required: requiredScope, has: scopes });
        res.status(403).json({ success: false, data: null, error: `This API key lacks the '${requiredScope}' scope` });
        return;
      }

      // Update last used
      await prisma.aPIKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date(), requestCount: { increment: 1 } } });

      // Attach org context
      (req as Request & { apiKeyOrg?: string }).apiKeyOrg = key.organizationId ?? undefined;
      next();
    } catch (err) {
      logger.error('API key validation error', { err });
      res.status(500).json({ success: false, data: null, error: 'Authentication error' });
    }
  };
}

/**
 * Security headers augmentation (supplements Helmet)
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('X-Request-ID', crypto.randomUUID());
  next();
}

/**
 * Detect and log suspicious request patterns (honeypot-style)
 */
export function honeypotDetection(req: Request, res: Response, next: NextFunction): void {
  const HONEYPOT_PATHS = [
    '/admin', '/wp-admin', '/wp-login', '/phpmyadmin', '/.env',
    '/config.json', '/backup', '/.git', '/shell', '/cmd',
    '/api/v1/admin/secret', '/actuator', '/metrics',
  ];
  const path = req.path.toLowerCase();
  if (HONEYPOT_PATHS.some((hp) => path.startsWith(hp) && !path.startsWith('/api/'))) {
    logger.warn('Honeypot triggered', { ip: req.ip, path: req.path, ua: req.headers['user-agent'] });
    // Delay + return 404 (don't tell them it's a honeypot)
    setTimeout(() => {
      res.status(404).json({ success: false, data: null, error: 'Not found' });
    }, 2000 + Math.random() * 1000);
    return;
  }
  next();
}

/**
 * Global security bundle — apply all in one call
 */
export const securityBundle = [
  additionalSecurityHeaders,
  blockScanners,
  blockPathTraversal,
  sanitizeInputs,
];
