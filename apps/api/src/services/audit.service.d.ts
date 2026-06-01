import type { PaginationQuery } from '../utils/paginate';
interface AuditQuery extends PaginationQuery {
    userId?: string;
    action?: string;
    resourceType?: string;
    dateFrom?: string;
    dateTo?: string;
}
export declare class AuditService {
    log(data: {
        userId?: string;
        action: string;
        resourceType: string;
        resourceId: string;
        resourceName?: string;
        ipAddress?: string;
        userAgent?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    list(query: AuditQuery): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
    exportCsv(query: Omit<AuditQuery, 'page' | 'limit'>): Promise<string>;
}
export declare const auditService: AuditService;
export {};
//# sourceMappingURL=audit.service.d.ts.map