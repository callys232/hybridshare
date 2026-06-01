import type { EventPayload } from '@hybridshare/shared/types/events';
export declare class EventService {
    private readonly BATCH_SIZE;
    private readonly SESSION_TTL;
    track(payload: EventPayload, userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
    trackBatch(events: EventPayload[], userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
    private upsertSession;
    getAnalytics(organizationId: string | null, from: Date, to: Date, granularity?: 'day' | 'week' | 'month'): Promise<{
        totalEvents: any;
        uniqueUsers: any;
        topEvents: any;
        topPages: any;
        eventsOverTime: any;
        funnels: {
            name: string;
            steps: {
                name: string;
                event: string;
                count: any;
                conversionRate: number;
                dropoffRate: number;
            }[];
            totalUsers: any;
            completionRate: number;
        }[];
    }>;
    private getEventsOverTime;
    private getCheckoutFunnel;
    getUserJourney(userId: string, limit?: number): Promise<any>;
    getLearningAnalytics(from: Date, to: Date): Promise<{
        totalEnrollments: any;
        completions: any;
        completionRate: number;
        avgProgress: number;
        totalTimeSpentHours: number;
        quizAttempts: any;
        avgQuizScore: number;
        videoPlays: any;
        topCourses: any;
    }>;
    private parseDevice;
    private parseBrowser;
    private parseOS;
}
export declare const eventService: EventService;
//# sourceMappingURL=event.service.d.ts.map