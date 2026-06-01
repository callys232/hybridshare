"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.encryptCredentials = encryptCredentials;
exports.decryptCredentials = decryptCredentials;
exports.generateSecureToken = generateSecureToken;
exports.generateShortToken = generateShortToken;
exports.hashToken = hashToken;
exports.computeChecksum = computeChecksum;
exports.getRefreshTokenExpiry = getRefreshTokenExpiry;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const ALGORITHM = 'aes-256-gcm';
const BCRYPT_ROUNDS = 12;
// ─── Password ─────────────────────────────────────────────────────────────────
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return bcrypt_1.default.compare(password, hash);
}
// ─── JWT ──────────────────────────────────────────────────────────────────────
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
        issuer: 'hybridshare',
        audience: 'hybridshare-client',
    });
}
function signRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId, type: 'refresh' }, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
        issuer: 'hybridshare',
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, {
        issuer: 'hybridshare',
        audience: 'hybridshare-client',
    });
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET, {
        issuer: 'hybridshare',
    });
}
// ─── AES-256-GCM Encryption ───────────────────────────────────────────────────
function encryptCredentials(plaintext) {
    const key = Buffer.from(env_1.env.AES_ENCRYPTION_KEY, 'hex');
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        encryptedData: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
    };
}
function decryptCredentials(encryptedData, iv, tag) {
    const key = Buffer.from(env_1.env.AES_ENCRYPTION_KEY, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData, 'base64')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}
// ─── Tokens ───────────────────────────────────────────────────────────────────
function generateSecureToken(bytes = 32) {
    return crypto_1.default.randomBytes(bytes).toString('hex');
}
function generateShortToken(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto_1.default.randomBytes(length))
        .map((b) => chars[b % chars.length])
        .join('');
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function computeChecksum(buffer) {
    return crypto_1.default.createHash('sha256').update(buffer).digest('hex');
}
function getRefreshTokenExpiry() {
    const days = parseInt(env_1.env.JWT_REFRESH_EXPIRES_IN.replace('d', ''), 10);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
}
//# sourceMappingURL=crypto.js.map