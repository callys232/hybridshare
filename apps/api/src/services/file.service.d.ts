import type { UpdateFileInput, BulkOperationInput } from '@hybridshare/shared/schemas/file.schema';
import type { PaginationQuery } from '../utils/paginate';
export declare class FileService {
    uploadFile(buffer: Buffer, originalName: string, mimeType: string, userId: string, options?: {
        workspaceId?: string;
        folderId?: string;
        description?: string;
        tags?: string[];
    }): Promise<any>;
    getFile(fileId: string, userId: string): Promise<any>;
    getDownloadUrl(fileId: string, userId: string): Promise<string>;
    getPreviewUrl(fileId: string, userId: string): Promise<{
        url: string;
        mimeType: string;
    }>;
    updateFile(fileId: string, userId: string, input: UpdateFileInput): Promise<any>;
    softDeleteFile(fileId: string, userId: string): Promise<void>;
    restoreFile(fileId: string, userId: string): Promise<any>;
    permanentDeleteFile(fileId: string, userId: string): Promise<void>;
    listFiles(userId: string, query: PaginationQuery & {
        workspaceId?: string;
        folderId?: string;
        mimeType?: string;
        search?: string;
        starred?: boolean;
        deleted?: boolean;
    }): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
    toggleStar(fileId: string, userId: string): Promise<any>;
    bulkOperation(userId: string, input: BulkOperationInput): Promise<{
        processed: number;
    }>;
    private copyFile;
    getRecycleBin(userId: string, query: PaginationQuery): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
}
export declare const fileService: FileService;
//# sourceMappingURL=file.service.d.ts.map