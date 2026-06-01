export type BadgeCategory = 'COMPLETION' | 'STREAK' | 'ENGAGEMENT' | 'ACHIEVEMENT' | 'SPECIAL' | 'SKILL';
export type GamificationEventType = 'COURSE_ENROLLED' | 'COURSE_COMPLETED' | 'LESSON_COMPLETED' | 'QUIZ_PASSED' | 'QUIZ_PERFECT' | 'ASSIGNMENT_SUBMITTED' | 'ASSIGNMENT_GRADED' | 'DAILY_LOGIN' | 'STREAK_MILESTONE' | 'COMMENT_POSTED' | 'REVIEW_GIVEN' | 'BADGE_EARNED' | 'REFERRAL_MADE' | 'COURSE_CREATED' | 'LIVE_SESSION_ATTENDED' | 'CERTIFICATE_EARNED' | 'LEADERBOARD_TOP' | 'FIRST_LOGIN';
export interface Badge {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    category: BadgeCategory;
    xpReward: number;
    criteria: BadgeCriteria;
    isActive: boolean;
    createdAt: string;
}
export interface BadgeCriteria {
    type: 'courses_completed' | 'streak_days' | 'quiz_score' | 'xp_total' | 'lessons_completed' | 'reviews_given' | 'posts_made' | 'specific_course';
    threshold: number;
    courseId?: string;
}
export interface UserBadge {
    id: string;
    userId: string;
    badgeId: string;
    badge?: Badge;
    earnedAt: string;
    metadata: Record<string, unknown>;
}
export interface GamificationEvent {
    id: string;
    userId: string;
    eventType: GamificationEventType;
    xpEarned: number;
    metadata: Record<string, unknown>;
    createdAt: string;
}
export interface LeaderboardEntry {
    id: string;
    userId: string;
    period: 'weekly' | 'monthly' | 'alltime';
    periodKey: string;
    xpPoints: number;
    rank: number;
    coursesCompleted: number;
    user?: {
        id: string;
        name: string;
        avatar?: string;
        jobTitle?: string;
    };
}
export interface UserGamificationProfile {
    userId: string;
    xpPoints: number;
    level: number;
    levelName: string;
    levelProgress: number;
    xpToNextLevel: number;
    streakDays: number;
    longestStreak: number;
    lastStreakDate?: string;
    badges: UserBadge[];
    recentEvents: GamificationEvent[];
    rank?: number;
    totalBadges: number;
    coursesCompleted: number;
    certificatesEarned: number;
}
export interface XPLevel {
    level: number;
    name: string;
    minXP: number;
    maxXP: number;
    iconUrl?: string;
    color: string;
}
export declare const XP_LEVELS: XPLevel[];
export declare const XP_REWARDS: Record<GamificationEventType, number>;
export declare function getUserLevel(xp: number): XPLevel;
export declare function getLevelProgress(xp: number): number;
//# sourceMappingURL=gamification.d.ts.map