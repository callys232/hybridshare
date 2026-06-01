import { prisma } from '../config/database';
import { notificationService } from './notification.service';
import { emitToUser } from '../config/socket';
import { logger } from '../utils/logger';
import type { GamificationEventType } from '@hybridshare/shared/types/gamification';
import { XP_REWARDS, XP_LEVELS, getUserLevel } from '@hybridshare/shared/types/gamification';

export class GamificationService {
  async awardXP(userId: string, eventType: GamificationEventType, metadata: Record<string, unknown> = {}) {
    const baseXP = XP_REWARDS[eventType] ?? 0;
    const xp = metadata.xp !== undefined ? (metadata.xp as number) : baseXP;
    if (xp <= 0) return;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { xpPoints: true } });
    if (!user) return;

    const prevLevel = getUserLevel(user.xpPoints);
    const newXP = user.xpPoints + xp;
    const newLevel = getUserLevel(newXP);

    // Record event
    await prisma.gamificationEvent.create({
      data: { userId, eventType: eventType as never, xpEarned: xp, metadata },
    });

    // Update user XP
    await prisma.user.update({ where: { id: userId }, data: { xpPoints: { increment: xp } } });

    // Level up notification
    if (newLevel.level > prevLevel.level) {
      await notificationService.create(userId, {
        type: 'level_up',
        title: `🎉 Level Up! You're now ${newLevel.name}`,
        message: `Congratulations! You've reached Level ${newLevel.level} with ${newXP.toLocaleString()} XP.`,
        resourceType: 'gamification',
        resourceId: userId,
      });
      emitToUser(userId, 'gamification:level_up', { level: newLevel, xp: newXP });
    } else {
      emitToUser(userId, 'gamification:xp_earned', { xp, total: newXP, event: eventType });
    }

    // Check and award badges
    await this.checkBadges(userId, eventType, newXP);

    // Update leaderboards
    await this.updateLeaderboards(userId, xp);

    // Update streak
    if (eventType === 'DAILY_LOGIN') {
      await this.updateStreak(userId);
    }

    logger.debug('XP awarded', { userId, eventType, xp, newTotal: newXP });
  }

  async updateStreak(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakDays: true, longestStreak: true, lastStreakDate: true },
    });
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = user.lastStreakDate ? new Date(user.lastStreakDate) : null;

    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 0) return; // Already checked in today
      if (diff === 1) {
        // Consecutive day
        const newStreak = user.streakDays + 1;
        const longestStreak = Math.max(user.longestStreak, newStreak);
        await prisma.user.update({
          where: { id: userId },
          data: { streakDays: newStreak, longestStreak, lastStreakDate: today },
        });
        // Streak milestones
        if ([7, 14, 30, 60, 90, 180, 365].includes(newStreak)) {
          await this.awardXP(userId, 'STREAK_MILESTONE', { streak: newStreak, xp: newStreak * 10 });
          await notificationService.create(userId, {
            type: 'streak_milestone',
            title: `🔥 ${newStreak}-Day Streak!`,
            message: `You've been learning for ${newStreak} days straight. Keep it up!`,
            resourceType: 'gamification',
            resourceId: userId,
          });
        }
      } else {
        // Streak broken
        await prisma.user.update({
          where: { id: userId },
          data: { streakDays: 1, lastStreakDate: today },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { streakDays: 1, lastStreakDate: today },
      });
    }
  }

  async checkBadges(userId: string, eventType: GamificationEventType, totalXP: number) {
    const allBadges = await prisma.badge.findMany({ where: { isActive: true } });
    const userBadgeIds = new Set(
      (await prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } })).map((b) => b.badgeId)
    );

    for (const badge of allBadges) {
      if (userBadgeIds.has(badge.id)) continue;
      const criteria = badge.criteria as { type: string; threshold: number; courseId?: string };

      let earned = false;
      switch (criteria.type) {
        case 'xp_total': earned = totalXP >= criteria.threshold; break;
        case 'courses_completed': {
          const count = await prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } });
          earned = count >= criteria.threshold;
          break;
        }
        case 'lessons_completed': {
          const count = await prisma.lessonProgress.count({ where: { userId, isCompleted: true } });
          earned = count >= criteria.threshold;
          break;
        }
        case 'streak_days': {
          const user = await prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } });
          earned = (user?.streakDays ?? 0) >= criteria.threshold;
          break;
        }
        case 'reviews_given': {
          const count = await prisma.courseReview.count({ where: { userId } });
          earned = count >= criteria.threshold;
          break;
        }
        case 'posts_made': {
          const count = await prisma.forumPost.count({ where: { authorId: userId } });
          earned = count >= criteria.threshold;
          break;
        }
        case 'specific_course': {
          const enrollment = criteria.courseId
            ? await prisma.enrollment.findFirst({ where: { userId, courseId: criteria.courseId, status: 'COMPLETED' } })
            : null;
          earned = !!enrollment;
          break;
        }
      }

      if (earned) {
        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        // Award XP for badge
        if (badge.xpReward > 0) {
          await prisma.user.update({ where: { id: userId }, data: { xpPoints: { increment: badge.xpReward } } });
          await prisma.gamificationEvent.create({
            data: { userId, eventType: 'BADGE_EARNED', xpEarned: badge.xpReward, metadata: { badgeId: badge.id } },
          });
        }
        await notificationService.create(userId, {
          type: 'badge_earned',
          title: `🏆 Badge Earned: ${badge.name}`,
          message: badge.description,
          resourceType: 'badge',
          resourceId: badge.id,
        });
        emitToUser(userId, 'gamification:badge_earned', { badge });
        logger.info('Badge earned', { userId, badgeId: badge.id, badgeName: badge.name });
      }
    }
  }

  async updateLeaderboards(userId: string, xpEarned: number) {
    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${String(Math.ceil(now.getDate() / 7)).padStart(2, '0')}`;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const periods = [
      { period: 'weekly', key: weekKey },
      { period: 'monthly', key: monthKey },
      { period: 'alltime', key: 'all' },
    ];

    for (const { period, key } of periods) {
      await prisma.leaderboardEntry.upsert({
        where: { userId_period_periodKey: { userId, period, periodKey: key } },
        create: { userId, period, periodKey: key, xpPoints: xpEarned },
        update: { xpPoints: { increment: xpEarned } },
      });
    }
  }

  async getLeaderboard(period: 'weekly' | 'monthly' | 'alltime', limit = 50) {
    const key = period === 'alltime' ? 'all' : this.getPeriodKey(period);

    const entries = await prisma.leaderboardEntry.findMany({
      where: { period, periodKey: key },
      orderBy: { xpPoints: 'desc' },
      take: limit,
      include: { user: { select: { id: true, name: true, avatar: true, jobTitle: true } } },
    });

    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }

  async getUserGamificationProfile(userId: string) {
    const [user, badges, recentEvents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { xpPoints: true, streakDays: true, longestStreak: true, lastStreakDate: true },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.gamificationEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const level = getUserLevel(user.xpPoints);
    const nextLevel = XP_LEVELS.find((l) => l.level === level.level + 1);
    const xpToNextLevel = nextLevel ? nextLevel.minXP - user.xpPoints : 0;
    const levelProgress = nextLevel
      ? Math.round(((user.xpPoints - level.minXP) / (nextLevel.minXP - level.minXP)) * 100)
      : 100;

    const [rank, coursesCompleted, certificatesEarned] = await Promise.all([
      prisma.leaderboardEntry.count({
        where: { period: 'alltime', periodKey: 'all', xpPoints: { gt: user.xpPoints } },
      }).then((c) => c + 1),
      prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.userCertificate.count({ where: { userId, status: 'ISSUED' } }),
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

  private getPeriodKey(period: 'weekly' | 'monthly'): string {
    const now = new Date();
    if (period === 'weekly') {
      return `${now.getFullYear()}-W${String(Math.ceil(now.getDate() / 7)).padStart(2, '0')}`;
    }
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

export const gamificationService = new GamificationService();
