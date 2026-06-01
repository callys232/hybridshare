export type BadgeCategory = 'COMPLETION' | 'STREAK' | 'ENGAGEMENT' | 'ACHIEVEMENT' | 'SPECIAL' | 'SKILL';
export type GamificationEventType =
  | 'COURSE_ENROLLED' | 'COURSE_COMPLETED' | 'LESSON_COMPLETED'
  | 'QUIZ_PASSED' | 'QUIZ_PERFECT' | 'ASSIGNMENT_SUBMITTED' | 'ASSIGNMENT_GRADED'
  | 'DAILY_LOGIN' | 'STREAK_MILESTONE' | 'COMMENT_POSTED' | 'REVIEW_GIVEN'
  | 'BADGE_EARNED' | 'REFERRAL_MADE' | 'COURSE_CREATED' | 'LIVE_SESSION_ATTENDED'
  | 'CERTIFICATE_EARNED' | 'LEADERBOARD_TOP' | 'FIRST_LOGIN';

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
  levelProgress: number; // 0-100
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

export const XP_LEVELS: XPLevel[] = [
  { level: 1, name: 'Novice', minXP: 0, maxXP: 500, color: '#94a3b8' },
  { level: 2, name: 'Explorer', minXP: 500, maxXP: 1500, color: '#60a5fa' },
  { level: 3, name: 'Learner', minXP: 1500, maxXP: 3000, color: '#34d399' },
  { level: 4, name: 'Scholar', minXP: 3000, maxXP: 6000, color: '#a78bfa' },
  { level: 5, name: 'Expert', minXP: 6000, maxXP: 12000, color: '#f59e0b' },
  { level: 6, name: 'Master', minXP: 12000, maxXP: 25000, color: '#ef4444' },
  { level: 7, name: 'Champion', minXP: 25000, maxXP: 50000, color: '#c12129' },
  { level: 8, name: 'Legend', minXP: 50000, maxXP: Infinity, color: '#1a1a1a' },
];

export const XP_REWARDS: Record<GamificationEventType, number> = {
  COURSE_ENROLLED: 25,
  COURSE_COMPLETED: 500,
  LESSON_COMPLETED: 10,
  QUIZ_PASSED: 50,
  QUIZ_PERFECT: 100,
  ASSIGNMENT_SUBMITTED: 30,
  ASSIGNMENT_GRADED: 20,
  DAILY_LOGIN: 5,
  STREAK_MILESTONE: 100,
  COMMENT_POSTED: 5,
  REVIEW_GIVEN: 20,
  BADGE_EARNED: 0,
  REFERRAL_MADE: 100,
  COURSE_CREATED: 200,
  LIVE_SESSION_ATTENDED: 75,
  CERTIFICATE_EARNED: 250,
  LEADERBOARD_TOP: 150,
  FIRST_LOGIN: 50,
};

export function getUserLevel(xp: number): XPLevel {
  return XP_LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? XP_LEVELS[0];
}

export function getLevelProgress(xp: number): number {
  const level = getUserLevel(xp);
  if (level.maxXP === Infinity) return 100;
  const range = level.maxXP - level.minXP;
  const progress = xp - level.minXP;
  return Math.min(100, Math.round((progress / range) * 100));
}
