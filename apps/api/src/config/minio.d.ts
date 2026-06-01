import * as Minio from 'minio';
export declare function getMinioClient(): Minio.Client;
export declare function initializeMinio(): Promise<void>;
export declare function checkMinioHealth(): Promise<boolean>;
export declare function generatePresignedUrl(objectPath: string, expirySeconds?: number, bucket?: string): Promise<string>;
export declare function generateUploadPresignedUrl(objectPath: string, expirySeconds?: number, bucket?: string): Promise<string>;
export declare function uploadBuffer(objectPath: string, buffer: Buffer, mimeType: string, metadata?: Record<string, string>, bucket?: string): Promise<void>;
export declare function deleteObject(objectPath: string, bucket?: string): Promise<void>;
export declare function deleteObjects(objectPaths: string[], bucket?: string): Promise<void>;
export declare function getObjectBuffer(objectPath: string, bucket?: string): Promise<Buffer>;
export declare function objectExists(objectPath: string, bucket?: string): Promise<boolean>;
export declare function buildObjectPath(userId: string, filename: string, prefix?: string): string;
//# sourceMappingURL=minio.d.ts.map