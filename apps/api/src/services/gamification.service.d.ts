import type { GamificationEventType } from '@hybridshare/shared/types/gamification';
export declare class GamificationService {
    awardXP(userId: string, eventType: GamificationEventType, metadata?: Record<string, unknown>): Promise<void>;
    updateStreak(userId: string): Promise<void>;
    checkBadges(userId: string, eventType: GamificationEventType, totalXP: number): Promise<void>;
    updateLeaderboards(userId: string, xpEarned: number): Promise<void>;
    getLeaderboard(period: 'weekly' | 'monthly' | 'alltime', limit?: number): Promise<any>;
    getUserGamificationProfile(userId: string): Promise<{
        userId: string;
        xpPoints: any;
        level: number;
        levelName: string;
        levelColor: string;
        levelProgress: number;
        xpToNextLevel: number;
        streakDays: any;
        longestStreak: any;
        lastStreakDate: any;
        badges: any;
        recentEvents: any;
        rank: any;
        totalBadges: any;
        coursesCompleted: any;
        certificatesEarned: any;
    }>;
    private getPeriodKey;
}
export declare const gamificationService: GamificationService;
//# sourceMappingURL=gamification.service.d.ts.map