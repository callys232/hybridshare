import type { JwtPayload } from '@hybridshare/shared/types/user';
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export declare function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
export declare function signRefreshToken(userId: string): string;
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): {
    sub: string;
    type: string;
};
export declare function encryptCredentials(plaintext: string): {
    encryptedData: string;
    iv: string;
    tag: string;
};
export declare function decryptCredentials(encryptedData: string, iv: string, tag: string): string;
export declare function generateSecureToken(bytes?: number): string;
export declare function generateShortToken(length?: number): string;
export declare function hashToken(token: string): string;
export declare function computeChecksum(buffer: Buffer): string;
export declare function getRefreshTokenExpiry(): Date;
//# sourceMappingURL=crypto.d.ts.map