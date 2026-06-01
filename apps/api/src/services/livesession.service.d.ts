export declare const liveSessionService: {
    listSessions(params?: {
        page?: number;
        limit?: number;
        status?: string;
        courseId?: string;
        hostId?: string;
    }): Promise<{
        items: any;
        meta: {
            total: any;
            page: number;
            limit: number;
        };
    }>;
    getSession(sessionId: string, userId?: string): Promise<any>;
    createSession(data: {
        title: string;
        description?: string;
        scheduledAt: Date;
        durationMinutes: number;
        timezone: string;
        hostId: string;
        lessonId?: string;
        platform: string;
        maxAttendees?: number;
        isRecorded: boolean;
    }): Promise<any>;
    registerAttendee(sessionId: string, userId: string): Promise<{
        alreadyRegistered: boolean;
        registered?: undefined;
    } | {
        registered: boolean;
        alreadyRegistered?: undefined;
    }>;
    startSession(sessionId: string, hostId: string): Promise<any>;
    endSession(sessionId: string, hostId: string, recordingUrl?: string): Promise<any>;
    cancelSession(sessionId: string, hostId: string, reason?: string): Promise<any>;
    getSessionAttendees(sessionId: string): Promise<any>;
};
//# sourceMappingURL=livesession.service.d.ts.map