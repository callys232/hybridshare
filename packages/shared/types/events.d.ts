export type EventCategory = 'PAGE_VIEW' | 'CLICK' | 'VIDEO_PLAY' | 'VIDEO_PAUSE' | 'VIDEO_SEEK' | 'VIDEO_COMPLETE' | 'VIDEO_BUFFER' | 'QUIZ_START' | 'QUIZ_SUBMIT' | 'QUIZ_PASS' | 'QUIZ_FAIL' | 'ENROLLMENT' | 'PURCHASE' | 'SEARCH' | 'FEATURE_USE' | 'DOWNLOAD' | 'SHARE' | 'COMMENT' | 'ERROR' | 'PERFORMANCE' | 'CUSTOM';
export interface EventPayload {
    event: string;
    category?: EventCategory;
    properties?: Record<string, unknown>;
    context?: EventContext;
    timestamp?: string;
    sessionId?: string;
    anonymousId?: string;
}
export interface EventContext {
    url?: string;
    referrer?: string;
    title?: string;
    search?: string;
    userAgent?: string;
    locale?: string;
    timezone?: string;
    screen?: {
        width: number;
        height: number;
    };
    campaign?: UTMParams;
}
export interface UTMParams {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
}
export interface TrackedEvent {
    id: string;
    userId?: string;
    sessionId?: string;
    anonymousId?: string;
    event: string;
    category: EventCategory;
    properties: Record<string, unknown>;
    context: EventContext;
    ipAddress?: string;
    userAgent?: string;
    url?: string;
    referrer?: string;
    timestamp: string;
}
export interface EventSession {
    id: string;
    userId?: string;
    anonymousId?: string;
    startedAt: string;
    endedAt?: string;
    duration?: number;
    pageViews: number;
    events: number;
    device?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
    utm: UTMParams;
}
export interface FunnelStep {
    name: string;
    event: string;
    count: number;
    conversionRate: number;
    dropoffRate: number;
    avgTimeToNext?: number;
}
export interface Funnel {
    name: string;
    steps: FunnelStep[];
    totalUsers: number;
    completionRate: number;
}
export interface EventAnalytics {
    totalEvents: number;
    uniqueUsers: number;
    activeSessions: number;
    avgSessionDuration: number;
    topEvents: Array<{
        event: string;
        count: number;
        uniqueUsers: number;
    }>;
    topPages: Array<{
        url: string;
        views: number;
        avgDuration: number;
        bounceRate: number;
    }>;
    eventsOverTime: Array<{
        date: string;
        count: number;
        uniqueUsers: number;
    }>;
    deviceDistribution: Record<string, number>;
    countryDistribution: Array<{
        country: string;
        count: number;
    }>;
    funnels: Funnel[];
    retentionCohorts: RetentionCohort[];
}
export interface RetentionCohort {
    period: string;
    users: number;
    retentionByWeek: number[];
}
export declare const LMS_EVENTS: {
    readonly PAGE_VIEWED: "page_viewed";
    readonly USER_SIGNED_UP: "user_signed_up";
    readonly USER_LOGGED_IN: "user_logged_in";
    readonly USER_LOGGED_OUT: "user_logged_out";
    readonly COURSE_VIEWED: "course_viewed";
    readonly COURSE_SEARCHED: "course_searched";
    readonly COURSE_ENROLLED: "course_enrolled";
    readonly COURSE_COMPLETED: "course_completed";
    readonly COURSE_DROPPED: "course_dropped";
    readonly COURSE_REVIEWED: "course_reviewed";
    readonly COURSE_SHARED: "course_shared";
    readonly LESSON_STARTED: "lesson_started";
    readonly LESSON_COMPLETED: "lesson_completed";
    readonly LESSON_BOOKMARKED: "lesson_bookmarked";
    readonly VIDEO_PLAYED: "video_played";
    readonly VIDEO_PAUSED: "video_paused";
    readonly VIDEO_SEEKED: "video_seeked";
    readonly VIDEO_COMPLETED: "video_completed";
    readonly VIDEO_SPEED_CHANGED: "video_speed_changed";
    readonly QUIZ_STARTED: "quiz_started";
    readonly QUIZ_SUBMITTED: "quiz_submitted";
    readonly QUIZ_PASSED: "quiz_passed";
    readonly QUIZ_FAILED: "quiz_failed";
    readonly ASSIGNMENT_STARTED: "assignment_started";
    readonly ASSIGNMENT_SUBMITTED: "assignment_submitted";
    readonly ASSIGNMENT_GRADED: "assignment_graded";
    readonly CHECKOUT_STARTED: "checkout_started";
    readonly CHECKOUT_COMPLETED: "checkout_completed";
    readonly CHECKOUT_FAILED: "checkout_failed";
    readonly COUPON_APPLIED: "coupon_applied";
    readonly CERTIFICATE_EARNED: "certificate_earned";
    readonly CERTIFICATE_DOWNLOADED: "certificate_downloaded";
    readonly CERTIFICATE_SHARED: "certificate_shared";
    readonly BADGE_EARNED: "badge_earned";
    readonly STREAK_ACHIEVED: "streak_achieved";
    readonly LEVEL_UP: "level_up";
    readonly FORUM_POST_CREATED: "forum_post_created";
    readonly FORUM_POST_LIKED: "forum_post_liked";
    readonly LIVE_SESSION_JOINED: "live_session_joined";
    readonly SEARCH_PERFORMED: "search_performed";
    readonly SEARCH_RESULT_CLICKED: "search_result_clicked";
    readonly FEATURE_USED: "feature_used";
};
export type LMSEventName = typeof LMS_EVENTS[keyof typeof LMS_EVENTS];
//# sourceMappingURL=events.d.ts.map