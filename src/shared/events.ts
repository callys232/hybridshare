export type EventCategory =
  | 'PAGE_VIEW' | 'CLICK' | 'VIDEO_PLAY' | 'VIDEO_PAUSE' | 'VIDEO_SEEK'
  | 'VIDEO_COMPLETE' | 'VIDEO_BUFFER' | 'QUIZ_START' | 'QUIZ_SUBMIT'
  | 'QUIZ_PASS' | 'QUIZ_FAIL' | 'ENROLLMENT' | 'PURCHASE' | 'SEARCH'
  | 'FEATURE_USE' | 'DOWNLOAD' | 'SHARE' | 'COMMENT' | 'ERROR'
  | 'PERFORMANCE' | 'CUSTOM';

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
  screen?: { width: number; height: number };
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
  topEvents: Array<{ event: string; count: number; uniqueUsers: number }>;
  topPages: Array<{ url: string; views: number; avgDuration: number; bounceRate: number }>;
  eventsOverTime: Array<{ date: string; count: number; uniqueUsers: number }>;
  deviceDistribution: Record<string, number>;
  countryDistribution: Array<{ country: string; count: number }>;
  funnels: Funnel[];
  retentionCohorts: RetentionCohort[];
}

export interface RetentionCohort {
  period: string;
  users: number;
  retentionByWeek: number[];
}

// Built-in event names
export const LMS_EVENTS = {
  // Page
  PAGE_VIEWED: 'page_viewed',
  // Auth
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  // Course
  COURSE_VIEWED: 'course_viewed',
  COURSE_SEARCHED: 'course_searched',
  COURSE_ENROLLED: 'course_enrolled',
  COURSE_COMPLETED: 'course_completed',
  COURSE_DROPPED: 'course_dropped',
  COURSE_REVIEWED: 'course_reviewed',
  COURSE_SHARED: 'course_shared',
  // Lesson
  LESSON_STARTED: 'lesson_started',
  LESSON_COMPLETED: 'lesson_completed',
  LESSON_BOOKMARKED: 'lesson_bookmarked',
  // Video
  VIDEO_PLAYED: 'video_played',
  VIDEO_PAUSED: 'video_paused',
  VIDEO_SEEKED: 'video_seeked',
  VIDEO_COMPLETED: 'video_completed',
  VIDEO_SPEED_CHANGED: 'video_speed_changed',
  // Quiz
  QUIZ_STARTED: 'quiz_started',
  QUIZ_SUBMITTED: 'quiz_submitted',
  QUIZ_PASSED: 'quiz_passed',
  QUIZ_FAILED: 'quiz_failed',
  // Assignment
  ASSIGNMENT_STARTED: 'assignment_started',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  ASSIGNMENT_GRADED: 'assignment_graded',
  // Payment
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  CHECKOUT_FAILED: 'checkout_failed',
  COUPON_APPLIED: 'coupon_applied',
  // Certificate
  CERTIFICATE_EARNED: 'certificate_earned',
  CERTIFICATE_DOWNLOADED: 'certificate_downloaded',
  CERTIFICATE_SHARED: 'certificate_shared',
  // Gamification
  BADGE_EARNED: 'badge_earned',
  STREAK_ACHIEVED: 'streak_achieved',
  LEVEL_UP: 'level_up',
  // Community
  FORUM_POST_CREATED: 'forum_post_created',
  FORUM_POST_LIKED: 'forum_post_liked',
  LIVE_SESSION_JOINED: 'live_session_joined',
  // Search
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  // Feature
  FEATURE_USED: 'feature_used',
} as const;

export type LMSEventName = typeof LMS_EVENTS[keyof typeof LMS_EVENTS];
