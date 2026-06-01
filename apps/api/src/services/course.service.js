"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseService = exports.CourseService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const paginate_1 = require("../utils/paginate");
const slugify_1 = __importDefault(require("slugify"));
class CourseService {
    // ─── Course CRUD ──────────────────────────────────────────────────────────
    async createCourse(userId, input) {
        const slug = input.slug ?? (0, slugify_1.default)(input.title, { lower: true, strict: true });
        const existing = await database_1.prisma.course.findUnique({ where: { slug } });
        if (existing) {
            const uniqueSlug = `${slug}-${Date.now()}`;
            return this._createCourse(userId, { ...input, slug: uniqueSlug });
        }
        return this._createCourse(userId, { ...input, slug });
    }
    async _createCourse(userId, input) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId }, include: { instructorProfile: true } });
        if (!user)
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        let instructorId = user.instructorProfile?.id;
        if (!instructorId) {
            const profile = await database_1.prisma.instructorProfile.create({
                data: { userId, headline: user.jobTitle ?? undefined, expertise: [] },
            });
            instructorId = profile.id;
        }
        const course = await database_1.prisma.course.create({
            data: {
                title: input.title,
                slug: input.slug,
                description: input.description,
                shortDescription: input.shortDescription,
                level: input.level,
                language: input.language,
                price: input.price,
                discountPrice: input.discountPrice,
                currency: input.currency,
                isFree: input.isFree || input.price === 0,
                isPublic: input.isPublic,
                categoryId: input.categoryId,
                outcomes: input.outcomes,
                requirements: input.requirements,
                tags: input.tags,
                certificateEnabled: input.certificateEnabled,
                instructorId,
                createdById: userId,
            },
            include: { instructor: { include: { user: { select: { id: true, name: true, avatar: true } } } }, category: true },
        });
        logger_1.logger.info('Course created', { courseId: course.id, userId });
        return course;
    }
    async getCourse(courseId, userId) {
        const course = await database_1.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                instructor: { include: { user: { select: { id: true, name: true, avatar: true, bio: true } } } },
                category: true,
                modules: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { sortOrder: 'asc' },
                            include: { quiz: { select: { id: true, type: true, passingScore: true, maxAttempts: true } } },
                        },
                    },
                },
                reviews: {
                    where: { isPublished: true },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                },
                _count: { select: { enrollments: true, reviews: true } },
            },
        });
        if (!course)
            throw Object.assign(new Error('Course not found'), { statusCode: 404 });
        let myEnrollment = null;
        if (userId) {
            myEnrollment = await database_1.prisma.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId } },
                include: { lessonProgress: true },
            });
        }
        return { ...course, myEnrollment };
    }
    async getCourseBySlug(slug, userId) {
        const course = await database_1.prisma.course.findUnique({ where: { slug } });
        if (!course)
            throw Object.assign(new Error('Course not found'), { statusCode: 404 });
        return this.getCourse(course.id, userId);
    }
    async updateCourse(courseId, userId, input) {
        await this.assertCourseOwner(courseId, userId);
        const updated = await database_1.prisma.course.update({
            where: { id: courseId },
            data: {
                ...input,
                level: input.level,
                isFree: input.isFree ?? (input.price !== undefined ? input.price === 0 : undefined),
            },
        });
        return updated;
    }
    async publishCourse(courseId, userId) {
        await this.assertCourseOwner(courseId, userId);
        // Validate course has at least one published lesson
        const lessonCount = await database_1.prisma.lesson.count({
            where: { module: { courseId }, isPublished: true },
        });
        if (lessonCount === 0) {
            throw Object.assign(new Error('Course must have at least one published lesson'), { statusCode: 400 });
        }
        return database_1.prisma.course.update({
            where: { id: courseId },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
        });
    }
    async archiveCourse(courseId, userId) {
        await this.assertCourseOwner(courseId, userId);
        return database_1.prisma.course.update({ where: { id: courseId }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
    }
    async deleteCourse(courseId, userId) {
        await this.assertCourseOwner(courseId, userId);
        const enrollments = await database_1.prisma.enrollment.count({ where: { courseId, status: 'ACTIVE' } });
        if (enrollments > 0) {
            throw Object.assign(new Error('Cannot delete course with active enrollments'), { statusCode: 400 });
        }
        await database_1.prisma.course.delete({ where: { id: courseId } });
    }
    async listCourses(query, userId) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const where = {};
        if (query.status)
            where.status = query.status;
        else
            where.status = 'PUBLISHED';
        if (query.level)
            where.level = query.level;
        if (query.categoryId)
            where.categoryId = query.categoryId;
        if (query.instructorId)
            where.instructorId = query.instructorId;
        if (query.organizationId)
            where.organizationId = query.organizationId;
        if (query.isFree !== undefined)
            where.isFree = query.isFree;
        if (query.search)
            where.title = { contains: query.search, mode: 'insensitive' };
        if (query.tags)
            where.tags = { hasSome: query.tags.split(',') };
        const orderBy = {};
        if (query.sortBy === 'popular')
            orderBy.totalStudents = 'desc';
        else if (query.sortBy === 'rating')
            orderBy.rating = 'desc';
        else if (query.sortBy === 'price_low')
            orderBy.price = 'asc';
        else if (query.sortBy === 'price_high')
            orderBy.price = 'desc';
        else
            orderBy.createdAt = 'desc';
        const [items, total] = await Promise.all([
            database_1.prisma.course.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    instructor: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                    category: true,
                    _count: { select: { enrollments: true, modules: true } },
                },
            }),
            database_1.prisma.course.count({ where }),
        ]);
        // Attach enrollment status
        let enrolledCourseIds = new Set();
        if (userId) {
            const enrollments = await database_1.prisma.enrollment.findMany({
                where: { userId, courseId: { in: items.map((c) => c.id) } },
                select: { courseId: true },
            });
            enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
        }
        return {
            items: items.map((c) => ({ ...c, isEnrolled: enrolledCourseIds.has(c.id) })),
            meta: (0, paginate_1.buildMeta)(total, page, limit),
        };
    }
    async getMyCourses(userId, query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const where = { userId };
        if (query.status)
            where.status = query.status;
        const [items, total] = await Promise.all([
            database_1.prisma.enrollment.findMany({
                where,
                skip,
                take,
                orderBy: { lastAccessedAt: 'desc' },
                include: {
                    course: {
                        include: {
                            instructor: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                            _count: { select: { modules: true } },
                        },
                    },
                },
            }),
            database_1.prisma.enrollment.count({ where }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit) };
    }
    async getInstructorCourses(userId, query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const [items, total] = await Promise.all([
            database_1.prisma.course.findMany({
                where: { createdById: userId },
                skip, take,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { enrollments: true, reviews: true } } },
            }),
            database_1.prisma.course.count({ where: { createdById: userId } }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit) };
    }
    // ─── Modules ──────────────────────────────────────────────────────────────
    async createModule(courseId, userId, input) {
        await this.assertCourseOwner(courseId, userId);
        return database_1.prisma.courseModule.create({ data: { courseId, ...input } });
    }
    async updateModule(moduleId, userId, input) {
        const module = await database_1.prisma.courseModule.findUnique({ where: { id: moduleId } });
        if (!module)
            throw Object.assign(new Error('Module not found'), { statusCode: 404 });
        await this.assertCourseOwner(module.courseId, userId);
        return database_1.prisma.courseModule.update({ where: { id: moduleId }, data: input });
    }
    async deleteModule(moduleId, userId) {
        const module = await database_1.prisma.courseModule.findUnique({ where: { id: moduleId } });
        if (!module)
            throw Object.assign(new Error('Module not found'), { statusCode: 404 });
        await this.assertCourseOwner(module.courseId, userId);
        await database_1.prisma.courseModule.delete({ where: { id: moduleId } });
    }
    async reorderModules(courseId, userId, order) {
        await this.assertCourseOwner(courseId, userId);
        await database_1.prisma.$transaction(order.map((m) => database_1.prisma.courseModule.update({ where: { id: m.id }, data: { sortOrder: m.sortOrder } })));
    }
    // ─── Lessons ──────────────────────────────────────────────────────────────
    async createLesson(userId, input) {
        const module = await database_1.prisma.courseModule.findUnique({ where: { id: input.moduleId } });
        if (!module)
            throw Object.assign(new Error('Module not found'), { statusCode: 404 });
        await this.assertCourseOwner(module.courseId, userId);
        const lesson = await database_1.prisma.lesson.create({ data: { ...input, type: input.type } });
        // Update course lesson count & duration
        await this.recalcCourseDuration(module.courseId);
        return lesson;
    }
    async updateLesson(lessonId, userId, input) {
        const lesson = await database_1.prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
        if (!lesson)
            throw Object.assign(new Error('Lesson not found'), { statusCode: 404 });
        await this.assertCourseOwner(lesson.module.courseId, userId);
        const updated = await database_1.prisma.lesson.update({ where: { id: lessonId }, data: { ...input, type: input.type } });
        await this.recalcCourseDuration(lesson.module.courseId);
        return updated;
    }
    async deleteLesson(lessonId, userId) {
        const lesson = await database_1.prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
        if (!lesson)
            throw Object.assign(new Error('Lesson not found'), { statusCode: 404 });
        await this.assertCourseOwner(lesson.module.courseId, userId);
        await database_1.prisma.lesson.delete({ where: { id: lessonId } });
        await this.recalcCourseDuration(lesson.module.courseId);
    }
    async reorderLessons(moduleId, userId, order) {
        const module = await database_1.prisma.courseModule.findUnique({ where: { id: moduleId } });
        if (!module)
            throw Object.assign(new Error('Module not found'), { statusCode: 404 });
        await this.assertCourseOwner(module.courseId, userId);
        await database_1.prisma.$transaction(order.map((l) => database_1.prisma.lesson.update({ where: { id: l.id }, data: { sortOrder: l.sortOrder } })));
    }
    // ─── Reviews ──────────────────────────────────────────────────────────────
    async createReview(courseId, userId, input) {
        const enrollment = await database_1.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (!enrollment) {
            throw Object.assign(new Error('You must be enrolled to review this course'), { statusCode: 403 });
        }
        const existing = await database_1.prisma.courseReview.findUnique({ where: { courseId_userId: { courseId, userId } } });
        if (existing) {
            const updated = await database_1.prisma.courseReview.update({ where: { id: existing.id }, data: input });
            await this.recalcRating(courseId);
            return updated;
        }
        const review = await database_1.prisma.courseReview.create({ data: { courseId, userId, ...input } });
        await this.recalcRating(courseId);
        return review;
    }
    async getReviews(courseId, query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const where = { courseId, isPublished: true };
        if (query.rating)
            where.rating = query.rating;
        const [items, total] = await Promise.all([
            database_1.prisma.courseReview.findMany({
                where, skip, take,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true, avatar: true } } },
            }),
            database_1.prisma.courseReview.count({ where }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit) };
    }
    // ─── Categories ───────────────────────────────────────────────────────────
    async getCategories() {
        return database_1.prisma.courseCategory.findMany({
            where: { isActive: true, parentId: null },
            orderBy: { sortOrder: 'asc' },
            include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        });
    }
    // ─── Course Stats ─────────────────────────────────────────────────────────
    async getCourseStats(courseId, userId) {
        await this.assertCourseOwner(courseId, userId);
        const [enrollmentStats, revenueStats, completionStats, reviewStats] = await Promise.all([
            database_1.prisma.enrollment.groupBy({
                by: ['status'],
                where: { courseId },
                _count: true,
            }),
            database_1.prisma.payment.aggregate({
                where: { enrollment: { courseId }, status: 'COMPLETED' },
                _sum: { amount: true },
                _count: true,
            }),
            database_1.prisma.enrollment.aggregate({
                where: { courseId, status: 'COMPLETED' },
                _avg: { progress: true, timeSpentMinutes: true },
                _count: true,
            }),
            database_1.prisma.courseReview.aggregate({
                where: { courseId, isPublished: true },
                _avg: { rating: true },
                _count: true,
            }),
        ]);
        const totalEnrollments = enrollmentStats.reduce((sum, s) => sum + s._count, 0);
        const completions = enrollmentStats.find((s) => s.status === 'COMPLETED')?._count ?? 0;
        return {
            totalEnrollments,
            activeEnrollments: enrollmentStats.find((s) => s.status === 'ACTIVE')?._count ?? 0,
            completions,
            completionRate: totalEnrollments ? Math.round((completions / totalEnrollments) * 100) : 0,
            totalRevenue: Number(revenueStats._sum.amount ?? 0),
            avgRating: reviewStats._avg.rating ?? 0,
            totalReviews: reviewStats._count,
            avgCompletionTime: completionStats._avg.timeSpentMinutes ?? 0,
        };
    }
    // ─── Helpers ──────────────────────────────────────────────────────────────
    async assertCourseOwner(courseId, userId) {
        const course = await database_1.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw Object.assign(new Error('Course not found'), { statusCode: 404 });
        if (course.createdById !== userId) {
            const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
            if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
                throw Object.assign(new Error('Access denied'), { statusCode: 403 });
            }
        }
        return course;
    }
    async recalcCourseDuration(courseId) {
        const result = await database_1.prisma.lesson.aggregate({
            where: { module: { courseId } },
            _sum: { durationMinutes: true },
            _count: true,
        });
        await database_1.prisma.course.update({
            where: { id: courseId },
            data: {
                durationMinutes: result._sum.durationMinutes ?? 0,
                totalLessons: result._count,
            },
        });
    }
    async recalcRating(courseId) {
        const result = await database_1.prisma.courseReview.aggregate({
            where: { courseId, isPublished: true },
            _avg: { rating: true },
            _count: true,
        });
        await database_1.prisma.course.update({
            where: { id: courseId },
            data: {
                rating: result._avg.rating ?? 0,
                totalRatings: result._count,
                totalReviews: result._count,
            },
        });
        // Also update instructor profile
        const course = await database_1.prisma.course.findUnique({ where: { id: courseId } });
        if (course?.instructorId) {
            const instructorStats = await database_1.prisma.courseReview.aggregate({
                where: { course: { instructorId: course.instructorId }, isPublished: true },
                _avg: { rating: true },
                _count: true,
            });
            await database_1.prisma.instructorProfile.update({
                where: { id: course.instructorId },
                data: { rating: instructorStats._avg.rating ?? 0, totalRatings: instructorStats._count },
            });
        }
    }
}
exports.CourseService = CourseService;
exports.courseService = new CourseService();
//# sourceMappingURL=course.service.js.map