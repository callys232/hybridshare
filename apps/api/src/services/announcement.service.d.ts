export declare const announcementService: {
    listAnnouncements(params?: {
        userId?: string;
        organizationId?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<any>;
    getAnnouncement(id: string): Promise<any>;
    createAnnouncement(data: {
        title: string;
        content: string;
        type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "FEATURE";
        isPinned?: boolean;
        actionUrl?: string;
        actionLabel?: string;
        expiresAt?: Date;
        organizationId?: string;
        authorId: string;
        targetRole?: string;
    }): Promise<any>;
    updateAnnouncement(id: string, data: Partial<{
        title: string;
        content: string;
        type: string;
        isPinned: boolean;
        actionUrl: string;
        actionLabel: string;
        expiresAt: Date;
        isActive: boolean;
    }>): Promise<any>;
    deleteAnnouncement(id: string): Promise<any>;
    markAsRead(announcementId: string, userId: string): Promise<any>;
    markAllRead(userId: string, organizationId?: string): Promise<void>;
    getUnreadCount(userId: string, organizationId?: string): Promise<number>;
};
//# sourceMappingURL=announcement.service.d.ts.map