"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationService = exports.GamificationService = void 0;
const database_1 = require("../config/database");
const notification_service_1 = require("./notification.service");
const socket_1 = require("../config/socket");
const logger_1 = require("../utils/logger");
const gamification_1 = require("@hybridshare/shared/types/gamification");
class GamificationService {
    async awardXP(userId, eventType, metadata = {}) {
        const baseXP = gamification_1.XP_REWARDS[eventType] ?? 0;
        const xp = metadata.xp !== undefined ? metadata.xp : baseXP;
        if (xp <= 0)
            return;
        const user = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { xpPoints: true } });
        if (!user)
            return;
        const prevLevel = (0, gamification_1.getUserLevel)(user.xpPoints);
        const newXP = user.xpPoints + xp;
        const newLevel = (0, gamification_1.getUserLevel)(newXP);
        // Record event
        await database_1.prisma.gamificationEvent.create({
            data: { userId, eventType: eventType, xpEarned: xp, metadata },
        });
        // Update user XP
        await database_1.prisma.user.update({ where: { id: userId }, data: { xpPoints: { increment: xp } } });
        // Level up notification
        if (newLevel.level > prevLevel.level) {
            await notification_service_1.notificationService.create(userId, {
                type: 'level_up',
                title: `🎉 Level Up! You're now ${newLevel.name}`,
                message: `Congratulations! You've reached Level ${newLevel.level} with ${newXP.toLocaleString()} XP.`,
                resourceType: 'gamification',
                resourceId: userId,
            });
            (0, socket_1.emitToUser)(userId, 'gamification:level_up', { level: newLevel, xp: newXP });
        }
        else {
            (0, socket_1.emitToUser)(userId, 'gamification:xp_earned', { xp, total: newXP, event: eventType });
        }
        // Check and award badges
        await this.checkBadges(userId, eventType, newXP);
        // Update leaderboards
        await this.updateLeaderboards(userId, xp);
        // Update streak
        if (eventType === 'DAILY_LOGIN') {
            await this.updateStreak(userId);
        }
        logger_1.logger.debug('XP awarded', { userId, eventType, xp, newTotal: newXP });
    }
    async updateStreak(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { streakDays: true, longestStreak: true, lastStreakDate: true },
        });
        if (!user)
            return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = user.lastStreakDate ? new Date(user.lastStreakDate) : null;
        if (lastDate) {
            lastDate.setHours(0, 0, 0, 0);
            const diff = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diff === 0)
                return; // Already checked in today
            if (diff === 1) {
                // Consecutive day
                const newStreak = user.streakDays + 1;
                const longestStreak = Math.max(user.longestStreak, newStreak);
                await database_1.prisma.user.update({
                    where: { id: userId },
                    data: { streakDays: newStreak, longestStreak, lastStreakDate: today },
                });
                // Streak milestones
                if ([7, 14, 30, 60, 90, 180, 365].includes(newStreak)) {
                    await this.awardXP(userId, 'STREAK_MILESTONE', { streak: newStreak, xp: newStreak * 10 });
                    await notification_service_1.notificationService.create(userId, {
                        type: 'streak_milestone',
                        title: `🔥 ${newStreak}-Day Streak!`,
                        message: `You've been learning for ${newStreak} days straight. Keep it up!`,
                        resourceType: 'gamification',
                        resourceId: userId,
                    });
                }
            }
            else {
                // Streak broken
                await database_1.prisma.user.update({
                    where: { id: userId },
                    data: { streakDays: 1, lastStreakDate: today },
                });
            }
        }
        else {
            await database_1.prisma.user.update({
                where: { id: userId },
                data: { streakDays: 1, lastStreakDate: today },
            });
        }
    }
    async checkBadges(userId, eventType, totalXP) {
        const allBadges = await database_1.prisma.badge.findMany({ where: { isActive: true } });
        const userBadgeIds = new Set((await database_1.prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } })).map((b) => b.badgeId));
        for (const badge of allBadges) {
            if (userBadgeIds.has(badge.id))
                continue;
            const criteria = badge.criteria;
            let earned = false;
            switch (criteria.type) {
                case 'xp_total':
                    earned = totalXP >= criteria.threshold;
                    break;
                case 'courses_completed': {
                    const count = await database_1.prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } });
                    earned = count >= criteria.threshold;
                    break;
                }
                case 'lessons_completed': {
                    const count = await database_1.prisma.lessonProgress.count({ where: { userId, isCompleted: true } });
                    earned = count >= criteria.threshold;
                    break;
                }
                case 'streak_days': {
                    const user = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } });
                    earned = (user?.streakDays ?? 0) >= criteria.threshold;
                    break;
                }
                case 'reviews_given': {
                    const count = await database_1.prisma.courseReview.count({ where: { userId } });
                    earned = count >= criteria.threshold;
                    break;
                }
                case 'posts_made': {
                    const count = await database_1.prisma.forumPost.count({ where: { authorId: userId } });
                    earned = count >= criteria.threshold;
                    break;
                }
                case 'specific_course': {
                    const enrollment = criteria.courseId
                        ? await database_1.prisma.enrollment.findFirst({ where: { userId, courseId: criteria.courseId, status: 'COMPLETED' } })
                        : null;
                    earned = !!enrollment;
                    break;
                }
            }
            if (earned) {
                await database_1.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
                // Award XP for badge
                if (badge.xpReward > 0) {
                    await database_1.prisma.user.update({ where: { id: userId }, data: { xpPoints: { increment: badge.xpReward } } });
                    await database_1.prisma.gamificationEvent.create({
                        data: { userId, eventType: 'BADGE_EARNED', xpEarned: badge.xpReward, metadata: { badgeId: badge.id } },
                    });
                }
                await notification_service_1.notificationService.create(userId, {
                    type: 'badge_earned',
                    title: `🏆 Badge Earned: ${badge.name}`,
                    message: badge.description,
                    resourceType: 'badge',
                    resourceId: badge.id,
                });
                (0, socket_1.emitToUser)(userId, 'gamification:badge_earned', { badge });
                logger_1.logger.info('Badge earned', { userId, badgeId: badge.id, badgeName: badge.name });
            }
        }
    }
    async updateLeaderboards(userId, xpEarned) {
        const now = new Date();
        const weekKey = `${now.getFullYear()}-W${String(Math.ceil(now.getDate() / 7)).padStart(2, '0')}`;
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const periods = [
            { period: 'weekly', key: weekKey },
            { period: 'monthly', key: monthKey },
            { period: 'alltime', key: 'all' },
        ];
        for (const { period, key } of periods) {
            await database_1.prisma.leaderboardEntry.upsert({
                where: { userId_period_periodKey: { userId, period, periodKey: key } },
                create: { userId, period, periodKey: key, xpPoints: xpEarned },
                update: { xpPoints: { increment: xpEarned } },
            });
        }
    }
    async getLeaderboard(period, limit = 50) {
        const key = period === 'alltime' ? 'all' : this.getPeriodKey(period);
        const entries = await database_1.prisma.leaderboardEntry.findMany({
            where: { period, periodKey: key },
            orderBy: { xpPoints: 'desc' },
            take: limit,
            include: { user: { select: { id: true, name: true, avatar: true, jobTitle: true } } },
        });
        return entries.map((e, i) => ({ ...e, rank: i + 1 }));
    }
    async getUserGamificationProfile(userId) {
        const [user, badges, recentEvents] = await Promise.all([
            database_1.prisma.user.findUnique({
                where: { id: userId },
                select: { xpPoints: true, streakDays: true, longestStreak: true, lastStreakDate: true },
            }),
            database_1.prisma.userBadge.findMany({
                where: { userId },
                include: { badge: true },
                orderBy: { earnedAt: 'desc' },
            }),
            database_1.prisma.gamificationEvent.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
        ]);
        if (!user)
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        const level = (0, gamification_1.getUserLevel)(user.xpPoints);
        const nextLevel = gamification_1.XP_LEVELS.find((l) => l.level === level.level + 1);
        const xpToNextLevel = nextLevel ? nextLevel.minXP - user.xpPoints : 0;
        const levelProgress = nextLevel
            ? Math.round(((user.xpPoints - level.minXP) / (nextLevel.minXP - level.minXP)) * 100)
            : 100;
        const [rank, coursesCompleted, certificatesEarned] = await Promise.all([
            database_1.prisma.leaderboardEntry.count({
                where: { period: 'alltime', periodKey: 'all', xpPoints: { gt: user.xpPoints } },
            }).then((c) => c + 1),
            database_1.prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } }),
            database_1.prisma.userCertificate.count({ where: { userId, status: 'ISSUED' } }),
        ]);
        return {
            userId,
            xpPoints: user.xpPoints,
            level: level.level,
            levelName: level.name,
            levelColor: level.color,
            levelProgress,
            xpToNextLevel,
            streakDays: user.streakDays,
            longestStreak: user.longestStreak,
            lastStreakDate: user.lastStreakDate?.toISOString(),
            badges,
            recentEvents,
            rank,
            totalBadges: badges.length,
            coursesCompleted,
            certificatesEarned,
        };
    }
    getPeriodKey(period) {
        const now = new Date();
        if (period === 'weekly') {
            return `${now.getFullYear()}-W${String(Math.ceil(now.getDate() / 7)).padStart(2, '0')}`;
        }
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}
exports.GamificationService = GamificationService;
exports.gamificationService = new GamificationService();
//# sourceMappingURL=gamification.service.js.map