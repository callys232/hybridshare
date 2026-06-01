export declare class AnalyticsService {
    getStorageBreakdown(workspaceId?: string): Promise<{
        total: number;
        quota: number;
        byUser: any;
        byWorkspace?: undefined;
        byMimeType?: undefined;
    } | {
        total: number;
        byWorkspace: any;
        byMimeType: any;
        quota?: undefined;
        byUser?: undefined;
    }>;
    getActivityTimeline(period?: 'daily' | 'weekly' | 'monthly', workspaceId?: string, days?: number): Promise<{
        uploads: number;
        bytes: number;
        date: string;
    }[]>;
    getTopFiles(workspaceId?: string, limit?: number): Promise<any>;
    getUserActivity(limit?: number): Promise<any>;
    getSocialPerformance(userId: string): Promise<{
        shares: any;
        totals: any;
    }>;
    getSystemStats(): Promise<{
        users: any;
        files: any;
        workspaces: any;
        storageUsed: number;
    }>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map