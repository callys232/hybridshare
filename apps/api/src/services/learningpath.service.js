"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.learningPathService = void 0;
const database_1 = require("../config/database");
const gamification_service_1 = require("./gamification.service");
const prisma = (0, database_1.getPrisma)();
exports.learningPathService = {
    async listPaths(params = {}) {
        const { page = 1, limit = 12, level, search } = params;
        const where = { status: 'PUBLISHED' };
        if (level)
            where.level = level;
        if (search)
            where.title = { contains: search, mode: 'insensitive' };
        const [items, total] = await Promise.all([
            prisma.learningPath.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    courses: {
                        include: { course: { select: { id: true, title: true, thumbnailUrl: true, durationMinutes: true } } },
                        orderBy: { sortOrder: 'asc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.learningPath.count({ where }),
        ]);
        return { items, meta: { total, page, limit } };
    },
    async getPath(pathIdOrSlug, userId) {
        const where = pathIdOrSlug.includes('-') && pathIdOrSlug.length < 30
            ? { slug: pathIdOrSlug }
            : { id: pathIdOrSlug };
        const path = await prisma.learningPath.findUniqueOrThrow({
            where,
            include: {
                courses: {
                    include: {
                        course: {
                            include: {
                                instructor: { include: { user: { select: { name: true } } } },
                                category: true,
                            },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        let myEnrollment = null;
        if (userId) {
            myEnrollment = await prisma.learningPathEnrollment.findFirst({
                where: { learningPathId: path.id, userId },
            });
        }
        return { ...path, myEnrollment };
    },
    async enrollPath(pathId, userId) {
        const existing = await prisma.learningPathEnrollment.findFirst({
            where: { learningPathId: pathId, userId },
        });
        if (existing)
            return existing;
        const enrollment = await prisma.learningPathEnrollment.create({
            data: { learningPathId: pathId, userId, progress: 0 },
        });
        // Auto-enroll in all required courses
        const path = await prisma.learningPath.findUniqueOrThrow({
            where: { id: pathId },
            include: { courses: { where: { isRequired: true } } },
        });
        for (const pc of path.courses) {
            const existing = await prisma.enrollment.findFirst({
                where: { courseId: pc.courseId, userId },
            });
            if (!existing) {
                const course = await prisma.course.findUnique({ where: { id: pc.courseId } });
                if (course?.isFree) {
                    await prisma.enrollment.create({
                        data: { courseId: pc.courseId, userId, status: 'ACTIVE', progress: 0, completedLessons: 0, totalLessons: course.totalLessons, xpEarned: 0, timeSpentMinutes: 0 },
                    });
                }
            }
        }
        await gamification_service_1.gamificationService.awardXP(userId, 'COURSE_ENROLLED', { learningPathId: pathId });
        return enrollment;
    },
    async recalcProgress(pathId, userId) {
        const path = await prisma.learningPath.findUniqueOrThrow({
            where: { id: pathId },
            include: { courses: true },
        });
        const courseIds = path.courses.map((pc) => pc.courseId);
        const completedCount = await prisma.enrollment.count({
            where: { userId, courseId: { in: courseIds }, status: 'COMPLETED' },
        });
        const progress = Math.round((completedCount / courseIds.length) * 100);
        await prisma.learningPathEnrollment.updateMany({
            where: { learningPathId: pathId, userId },
            data: { progress, completedAt: progress === 100 ? new Date() : null },
        });
        return progress;
    },
    async createPath(data) {
        const path = await prisma.learningPath.create({
            data: {
                title: data.title,
                slug: data.slug,
                description: data.description,
                level: data.level,
                tags: data.tags,
                status: 'DRAFT',
                estimatedHours: 0,
            },
        });
        const courseLinks = data.courseIds.map((courseId, i) => ({
            learningPathId: path.id,
            courseId,
            sortOrder: i,
            isRequired: true,
        }));
        await prisma.learningPathCourse.createMany({ data: courseLinks });
        // Recalc estimated hours
        const courses = await prisma.course.findMany({ where: { id: { in: data.courseIds } } });
        const totalMins = courses.reduce((sum, c) => sum + c.durationMinutes, 0);
        await prisma.learningPath.update({
            where: { id: path.id },
            data: { estimatedHours: Math.ceil(totalMins / 60) },
        });
        return path;
    },
    async publishPath(pathId) {
        return prisma.learningPath.update({ where: { id: pathId }, data: { status: 'PUBLISHED' } });
    },
    async deletePath(pathId) {
        await prisma.learningPathCourse.deleteMany({ where: { learningPathId: pathId } });
        await prisma.learningPath.delete({ where: { id: pathId } });
    },
};
//# sourceMappingURL=learningpath.service.js.map