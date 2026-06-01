export declare const learningPathService: {
    listPaths(params?: {
        page?: number;
        limit?: number;
        level?: string;
        search?: string;
    }): Promise<{
        items: any;
        meta: {
            total: any;
            page: number;
            limit: number;
        };
    }>;
    getPath(pathIdOrSlug: string, userId?: string): Promise<any>;
    enrollPath(pathId: string, userId: string): Promise<any>;
    recalcProgress(pathId: string, userId: string): Promise<number>;
    createPath(data: {
        title: string;
        slug: string;
        description?: string;
        level: string;
        tags: string[];
        courseIds: string[];
    }): Promise<any>;
    publishPath(pathId: string): Promise<any>;
    deletePath(pathId: string): Promise<void>;
};
//# sourceMappingURL=learningpath.service.d.ts.map