export declare class VersionService {
    listVersions(fileId: string): Promise<any>;
    uploadVersion(fileId: string, buffer: Buffer, originalName: string, mimeType: string, userId: string, comment?: string): Promise<any>;
    restoreVersion(fileId: string, versionId: string, userId: string): Promise<any>;
}
export declare const versionService: VersionService;
//# sourceMappingURL=version.service.d.ts.map