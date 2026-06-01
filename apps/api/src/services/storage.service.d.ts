export interface UploadResult {
    storagePath: string;
    thumbnailPath: string | null;
    size: number;
    checksum: string;
    mimeType: string;
}
export declare class StorageService {
    uploadFile(buffer: Buffer, originalName: string, mimeType: string, userId: string, metadata?: Record<string, string>): Promise<UploadResult>;
    uploadVersion(buffer: Buffer, originalName: string, mimeType: string, fileId: string, userId: string, version: number): Promise<UploadResult>;
    deleteFile(storagePath: string, thumbnailPath?: string | null): Promise<void>;
    getDownloadUrl(storagePath: string, expirySeconds?: number): Promise<string>;
    getPreviewUrl(storagePath: string): Promise<string>;
    private generateThumbnail;
    uploadAvatar(buffer: Buffer, userId: string): Promise<string>;
    isImage(mimeType: string): boolean;
    sanitizeFileName(name: string): string;
    getFileExtension(name: string): string;
}
export declare const storageService: StorageService;
//# sourceMappingURL=storage.service.d.ts.map