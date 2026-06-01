"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XP_REWARDS = exports.XP_LEVELS = void 0;
exports.getUserLevel = getUserLevel;
exports.getLevelProgress = getLevelProgress;
exports.XP_LEVELS = [
    { level: 1, name: 'Novice', minXP: 0, maxXP: 500, color: '#94a3b8' },
    { level: 2, name: 'Explorer', minXP: 500, maxXP: 1500, color: '#60a5fa' },
    { level: 3, name: 'Learner', minXP: 1500, maxXP: 3000, color: '#34d399' },
    { level: 4, name: 'Scholar', minXP: 3000, maxXP: 6000, color: '#a78bfa' },
    { level: 5, name: 'Expert', minXP: 6000, maxXP: 12000, color: '#f59e0b' },
    { level: 6, name: 'Master', minXP: 12000, maxXP: 25000, color: '#ef4444' },
    { level: 7, name: 'Champion', minXP: 25000, maxXP: 50000, color: '#c12129' },
    { level: 8, name: 'Legend', minXP: 50000, maxXP: Infinity, color: '#1a1a1a' },
];
exports.XP_REWARDS = {
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
function getUserLevel(xp) {
    return exports.XP_LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? exports.XP_LEVELS[0];
}
function getLevelProgress(xp) {
    const level = getUserLevel(xp);
    if (level.maxXP === Infinity)
        return 100;
    const range = level.maxXP - level.minXP;
    const progress = xp - level.minXP;
    return Math.min(100, Math.round((progress / range) * 100));
}
//# sourceMappingURL=gamification.js.map