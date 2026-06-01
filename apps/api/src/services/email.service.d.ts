declare class EmailService {
    private transporter;
    constructor();
    private send;
    sendVerificationEmail(email: string, name: string, token: string): Promise<void>;
    sendPasswordResetEmail(email: string, name: string, token: string): Promise<void>;
    sendShareNotification(email: string, senderName: string, resourceName: string, shareUrl: string): Promise<void>;
    sendWorkspaceInvite(email: string, inviterName: string, workspaceName: string, inviteUrl: string): Promise<void>;
    sendWeeklyDigest(email: string, name: string, stats: {
        filesUploaded: number;
        storageUsed: string;
        activeWorkspaces: number;
        recentFiles: Array<{
            name: string;
            url: string;
        }>;
    }): Promise<void>;
    private baseTemplate;
    private verificationTemplate;
    private passwordResetTemplate;
    private shareNotificationTemplate;
    private workspaceInviteTemplate;
    private weeklyDigestTemplate;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map