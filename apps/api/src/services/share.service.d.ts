import type { CreateShareLinkInput } from '@hybridshare/shared/schemas/file.schema';
import type { PaginationQuery } from '../utils/paginate';
export declare class ShareService {
    createShareLink(userId: string, input: CreateShareLinkInput): Promise<any>;
    resolveShareLink(token: string): Promise<{
        id: any;
        token: any;
        permissions: any;
        hasPassword: boolean;
        expiresAt: any;
        file: any;
        folder: any;
        workspace: any;
        createdBy: any;
    }>;
    verifySharePassword(token: string, password: string): Promise<boolean>;
    recordView(token: string, ipAddress?: string, userAgent?: string, referrer?: string): Promise<void>;
    revokeShareLink(id: string, userId: string): Promise<void>;
    listShareLinks(userId: string, query: PaginationQuery): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
    getShareAnalytics(id: string, userId: string): Promise<{
        totalViews: any;
        uniqueVisitors: number;
        viewsByDay: Record<string, number>;
        recentViews: any;
    }>;
}
export declare const shareService: ShareService;
//# sourceMappingURL=share.service.d.ts.map