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
/**
 * Block known scanner user agents
 */
export declare function blockScanners(req: Request, res: Response, next: NextFunction): void;
/**
 * Detect path traversal in URL
 */
export declare function blockPathTraversal(req: Request, res: Response, next: NextFunction): void;
/**
 * Sanitize and validate all request inputs (body, query, params)
 */
export declare function sanitizeInputs(req: Request, res: Response, next: NextFunction): void;
/**
 * Enforce JSON Content-Type on POST/PUT/PATCH (unless multipart)
 */
export declare function enforceContentType(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate HMAC signature on inbound Stripe webhooks.
 * The raw body must be captured before JSON parsing — use express.raw() on webhook routes.
 */
export declare function verifyStripeWebhook(req: Request, res: Response, next: NextFunction): void;
/**
 * Generic HMAC webhook signature verifier (for custom webhooks sent by HybridShare)
 */
export declare function verifyWebhookSignature(secret: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * API Key scope validator.
 * Usage: validateApiKeyScope('courses:read')
 */
export declare function validateApiKeyScope(requiredScope: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Security headers augmentation (supplements Helmet)
 */
export declare function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction): void;
/**
 * Detect and log suspicious request patterns (honeypot-style)
 */
export declare function honeypotDetection(req: Request, res: Response, next: NextFunction): void;
/**
 * Global security bundle — apply all in one call
 */
export declare const securityBundle: (typeof additionalSecurityHeaders)[];
//# sourceMappingURL=security.middleware.d.ts.map