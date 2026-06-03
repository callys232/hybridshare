import { describe, it, expect } from 'vitest';
import { signAccessToken, signRefreshToken, verifyToken, hashPassword, comparePassword, generateToken } from '@/lib/auth';

describe('auth lib', () => {
  describe('JWT', () => {
    it('signs and verifies an access token', async () => {
      const token = await signAccessToken({ sub: 'user-1', email: 'a@b.com', role: 'MEMBER' });
      expect(typeof token).toBe('string');

      const payload = await verifyToken(token);
      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('a@b.com');
      expect(payload.role).toBe('MEMBER');
    });

    it('throws on an invalid token', async () => {
      await expect(verifyToken('invalid.token.here')).rejects.toThrow();
    });

    it('signs a refresh token', async () => {
      const token = await signRefreshToken('user-1');
      expect(typeof token).toBe('string');
      const payload = await verifyToken(token);
      expect(payload.sub).toBe('user-1');
    });
  });

  describe('passwords', () => {
    it('hashes and verifies a password', async () => {
      const hash = await hashPassword('Secret@123');
      expect(hash).not.toBe('Secret@123');
      await expect(comparePassword('Secret@123', hash)).resolves.toBe(true);
      await expect(comparePassword('Wrong@Pass1', hash)).resolves.toBe(false);
    });
  });

  describe('generateToken', () => {
    it('returns a hex string of the requested byte length', () => {
      const t = generateToken(32);
      expect(t).toHaveLength(64);     // 32 bytes → 64 hex chars
      expect(/^[0-9a-f]+$/.test(t)).toBe(true);
    });

    it('generates unique tokens', () => {
      expect(generateToken()).not.toBe(generateToken());
    });
  });
});
