import type { PaginationQuery } from '../utils/paginate';
interface CreateNotificationInput {
    userId: string;
    type: string;
    title: string;
    message: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
}
export declare class NotificationService {
    create(input: CreateNotificationInput): Promise<any>;
    createBulk(inputs: CreateNotificationInput[]): Promise<void>;
    list(userId: string, query: PaginationQuery): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
        unreadCount: any;
    }>;
    markRead(id: string, userId: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
    dismiss(id: string, userId: string): Promise<void>;
    notifyWorkspaceMembers(workspaceId: string, excludeUserId: string, notification: Omit<CreateNotificationInput, 'userId'>): Promise<void>;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notification.service.d.ts.map