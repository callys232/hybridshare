"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentService = exports.EnrollmentService = void 0;
const database_1 = require("../config/database");
const notification_service_1 = require("./notification.service");
const gamification_service_1 = require("./gamification.service");
const email_service_1 = require("./email.service");
const socket_1 = require("../config/socket");
const logger_1 = require("../utils/logger");
class EnrollmentService {
    // ─── Enrollment ───────────────────────────────────────────────────────────
    async enrollFree(userId, courseId, cohortId) {
        const course = await database_1.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw Object.assign(new Error('Course not found'), { statusCode: 404 });
        if (!course.isFree && course.price > 0) {
            throw Object.assign(new Error('This course requires payment'), { statusCode: 402 });
        }
        return this.createEnrollment(userId, courseId, 'direct', cohortId);
    }
    async enrollAfterPayment(userId, courseId, paymentId) {
        return this.createEnrollment(userId, courseId, 'purchase', undefined, paymentId);
    }
    async createEnrollment(userId, courseId, enrolledVia, cohortId, paymentId) {
        const existing = await database_1.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (existing) {
            if (existing.status === 'ACTIVE' || existing.status === 'COMPLETED') {
                throw Object.assign(new Error('Already enrolled'), { statusCode: 409 });
            }
            // Re-activate dropped enrollment
            return database_1.prisma.enrollment.update({
                where: { id: existing.id },
                data: { status: 'ACTIVE', lastAccessedAt: new Date() },
            });
        }
        const course = await database_1.prisma.course.findUnique({
            where: { id: courseId },
            include: { _count: { select: { modules: true } } },
        });
        if (!course)
            throw Object.assign(new Error('Course not found'), { statusCode: 404 });
        const totalLessons = await database_1.prisma.lesson.count({
            where: { module: { courseId }, isPublished: true },
        });
        const enrollment = await database_1.prisma.enrollment.create({
            data: {
                userId,
                courseId,
                enrolledVia,
                cohortId,
                paymentId,
                totalLessons,
                status: 'ACTIVE',
            },
        });
        // Update course student count
        await database_1.prisma.course.update({
            where: { id: courseId },
            data: { totalStudents: { increment: 1 } },
        });
        // Award XP
        await gamification_service_1.gamificationService.awardXP(userId, 'COURSE_ENROLLED', { courseId });
        // Send enrollment confirmation email
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            await email_service_1.emailService.sendEnrollmentConfirmation(user.email, user.name, course.title, course.slug);
        }
        // Notify instructor
        if (course.instructorId) {
            const instructor = await database_1.prisma.instructorProfile.findUnique({
                where: { id: course.instructorId },
                include: { user: true },
            });
            if (instructor) {
                await notification_service_1.notificationService.create(instructor.userId, {
                    type: 'new_enrollment',
                    title: 'New Student Enrolled',
                    message: `A new student enrolled in "${course.title}"`,
                    resourceType: 'course',
                    resourceId: courseId,
                });
            }
        }
        (0, socket_1.emitToUser)(userId, 'enrollment:created', { courseId, enrollmentId: enrollment.id });
        logger_1.logger.info('Enrollment created', { userId, courseId, enrollmentId: enrollment.id });
        return enrollment;
    }
    // ─── Progress Tracking ────────────────────────────────────────────────────
    async updateLessonProgress(userId, input) {
        const lesson = await database_1.prisma.lesson.findUnique({
            where: { id: input.lessonId },
            include: { module: true },
        });
        if (!lesson)
            throw Object.assign(new Error('Lesson not found'), { statusCode: 404 });
        const enrollment = await database_1.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
        });
        if (!enrollment)
            throw Object.assign(new Error('Not enrolled'), { statusCode: 403 });
        const existing = await database_1.prisma.lessonProgress.findUnique({
            where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: input.lessonId } },
        });
        const watchPercentage = input.totalSeconds && input.watchedSeconds
            ? Math.round((input.watchedSeconds / input.totalSeconds) * 100)
            : existing?.watchPercentage ?? 0;
        const willComplete = input.isCompleted || watchPercentage >= 85;
        const wasAlreadyCompleted = existing?.isCompleted ?? false;
        const progress = await database_1.prisma.lessonProgress.upsert({
            where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: input.lessonId } },
            create: {
                enrollmentId: enrollment.id,
                lessonId: input.lessonId,
                userId,
                watchedSeconds: input.watchedSeconds ?? 0,
                totalSeconds: input.totalSeconds ?? 0,
                watchPercentage,
                lastPosition: input.lastPosition ?? 0,
                isCompleted: willComplete,
                completedAt: willComplete ? new Date() : null,
                attempts: 1,
            },
            update: {
                watchedSeconds: input.watchedSeconds ?? existing?.watchedSeconds,
                totalSeconds: input.totalSeconds ?? existing?.totalSeconds,
                watchPercentage: Math.max(watchPercentage, existing?.watchPercentage ?? 0),
                lastPosition: input.lastPosition ?? existing?.lastPosition,
                isCompleted: willComplete || wasAlreadyCompleted,
                completedAt: !wasAlreadyCompleted && willComplete ? new Date() : existing?.completedAt,
                attempts: { increment: 1 },
            },
        });
        // Recalculate enrollment progress if lesson was newly completed
        if (willComplete && !wasAlreadyCompleted) {
            await this.recalcEnrollmentProgress(enrollment.id, lesson.module.courseId, userId);
            await gamification_service_1.gamificationService.awardXP(userId, 'LESSON_COMPLETED', { lessonId: input.lessonId, xp: lesson.xpReward });
        }
        return progress;
    }
    async recalcEnrollmentProgress(enrollmentId, courseId, userId) {
        const [completedCount, totalCount] = await Promise.all([
            database_1.prisma.lessonProgress.count({ where: { enrollmentId, isCompleted: true } }),
            database_1.prisma.lesson.count({ where: { module: { courseId }, isPublished: true } }),
        ]);
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const isCompleted = progress === 100;
        const enrollment = await database_1.prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
                progress,
                completedLessons: completedCount,
                totalLessons: totalCount,
                lastAccessedAt: new Date(),
                status: isCompleted ? 'COMPLETED' : 'ACTIVE',
                completedAt: isCompleted ? new Date() : null,
            },
        });
        if (isCompleted) {
            await this.handleCourseCompletion(userId, courseId, enrollmentId);
        }
        return enrollment;
    }
    async handleCourseCompletion(userId, courseId, enrollmentId) {
        const [course, user] = await Promise.all([
            database_1.prisma.course.findUnique({ where: { id: courseId } }),
            database_1.prisma.user.findUnique({ where: { id: userId } }),
        ]);
        if (!course || !user)
            return;
        // Award XP
        await gamification_service_1.gamificationService.awardXP(userId, 'COURSE_COMPLETED', { courseId });
        // Issue certificate if enabled
        if (course.certificateEnabled) {
            const template = await database_1.prisma.certificateTemplate.findUnique({ where: { courseId } });
            await database_1.prisma.userCertificate.upsert({
                where: { enrollmentId },
                create: {
                    userId,
                    enrollmentId,
                    templateId: template?.id,
                    courseId,
                    title: `${course.title} — Certificate of Completion`,
                    status: 'ISSUED',
                    metadata: { courseTitle: course.title, completedAt: new Date().toISOString() },
                },
                update: {},
            });
            await gamification_service_1.gamificationService.awardXP(userId, 'CERTIFICATE_EARNED', { courseId });
        }
        // Send completion email
        await email_service_1.emailService.sendCourseCompletionEmail(user.email, user.name, course.title, course.slug);
        // Emit real-time event
        (0, socket_1.emitToUser)(userId, 'course:completed', { courseId, enrollmentId });
        // Notify instructor
        if (course.instructorId) {
            const instructor = await database_1.prisma.instructorProfile.findUnique({ where: { id: course.instructorId } });
            if (instructor) {
                await notification_service_1.notificationService.create(instructor.userId, {
                    type: 'course_completed',
                    title: 'Student Completed Course',
                    message: `${user.name} completed "${course.title}"`,
                    resourceType: 'course',
                    resourceId: courseId,
                });
            }
        }
        logger_1.logger.info('Course completed', { userId, courseId, enrollmentId });
    }
    // ─── Quiz Submission ──────────────────────────────────────────────────────
    async submitQuiz(userId, input) {
        const quiz = await database_1.prisma.quiz.findUnique({
            where: { id: input.quizId },
            include: {
                questions: { include: { options: true } },
                lesson: { include: { module: true } },
            },
        });
        if (!quiz)
            throw Object.assign(new Error('Quiz not found'), { statusCode: 404 });
        // Check attempt limit
        if (quiz.maxAttempts) {
            const attemptCount = await database_1.prisma.quizAttempt.count({
                where: { quizId: input.quizId, userId },
            });
            if (attemptCount >= quiz.maxAttempts) {
                throw Object.assign(new Error(`Maximum ${quiz.maxAttempts} attempts reached`), { statusCode: 429 });
            }
        }
        const attemptNumber = (await database_1.prisma.quizAttempt.count({ where: { quizId: input.quizId, userId } })) + 1;
        // Grade the quiz
        let totalScore = 0;
        let maxScore = 0;
        const gradedAnswers = [];
        for (const question of quiz.questions) {
            maxScore += question.points;
            const answer = input.answers.find((a) => a.questionId === question.id);
            if (!answer) {
                gradedAnswers.push({ questionId: question.id, selectedOptionIds: [], isCorrect: false, points: 0 });
                continue;
            }
            let isCorrect = false;
            let earned = 0;
            if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
                const correctOption = question.options.find((o) => o.isCorrect);
                isCorrect = answer.selectedOptionIds.length === 1 && answer.selectedOptionIds[0] === correctOption?.id;
                earned = isCorrect ? question.points : 0;
            }
            else if (question.type === 'MULTIPLE_CHOICE') {
                const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
                const selectedIds = new Set(answer.selectedOptionIds);
                isCorrect = correctIds.size === selectedIds.size && [...correctIds].every((id) => selectedIds.has(id));
                earned = isCorrect ? question.points : 0;
            }
            else {
                // Short/long answer — mark as pending for manual grading
                earned = 0;
            }
            totalScore += earned;
            gradedAnswers.push({ ...answer, isCorrect, points: earned });
        }
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        const isPassed = percentage >= quiz.passingScore;
        const attempt = await database_1.prisma.quizAttempt.create({
            data: {
                quizId: input.quizId,
                userId,
                enrollmentId: input.enrollmentId,
                attempt: attemptNumber,
                score: totalScore,
                maxScore,
                percentage,
                isPassed,
                timeSpent: input.timeSpent,
                submittedAt: new Date(),
                answers: { create: gradedAnswers },
            },
            include: { answers: true },
        });
        // Award XP
        if (isPassed) {
            const xpEvent = percentage === 100 ? 'QUIZ_PERFECT' : 'QUIZ_PASSED';
            await gamification_service_1.gamificationService.awardXP(userId, xpEvent, { quizId: input.quizId, score: percentage });
        }
        // Update lesson progress if passed
        if (isPassed && input.enrollmentId) {
            await this.updateLessonProgress(userId, {
                lessonId: quiz.lessonId,
                isCompleted: true,
            });
        }
        return {
            attempt,
            isPassed,
            score: totalScore,
            maxScore,
            percentage,
            passingScore: quiz.passingScore,
            xpEarned: isPassed ? quiz.xpReward : 0,
        };
    }
    // ─── Assignment Submission ────────────────────────────────────────────────
    async submitAssignment(userId, input) {
        const assignment = await database_1.prisma.assignment.findUnique({ where: { id: input.assignmentId } });
        if (!assignment)
            throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
        const existing = await database_1.prisma.assignmentSubmission.findFirst({
            where: { assignmentId: input.assignmentId, userId, status: { notIn: ['RESUBMIT'] } },
        });
        if (existing && !['RESUBMIT', 'GRADED'].includes(existing.status)) {
            throw Object.assign(new Error('Already submitted'), { statusCode: 409 });
        }
        const submission = await database_1.prisma.assignmentSubmission.create({
            data: {
                assignmentId: input.assignmentId,
                userId,
                content: input.content,
                fileUrls: input.fileUrls,
                status: 'SUBMITTED',
                submittedAt: new Date(),
            },
        });
        await gamification_service_1.gamificationService.awardXP(userId, 'ASSIGNMENT_SUBMITTED', { assignmentId: input.assignmentId });
        return submission;
    }
    // ─── Get Progress ─────────────────────────────────────────────────────────
    async getEnrollmentDetails(userId, courseId) {
        const enrollment = await database_1.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: {
                course: {
                    include: {
                        modules: {
                            orderBy: { sortOrder: 'asc' },
                            include: {
                                lessons: {
                                    orderBy: { sortOrder: 'asc' },
                                    include: { quiz: true, assignment: true },
                                },
                            },
                        },
                    },
                },
                lessonProgress: true,
                quizAttempts: { orderBy: { createdAt: 'desc' } },
                certificate: true,
            },
        });
        if (!enrollment)
            throw Object.assign(new Error('Enrollment not found'), { statusCode: 404 });
        return enrollment;
    }
    async getNextLesson(userId, courseId) {
        const enrollment = await database_1.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: { lessonProgress: { where: { isCompleted: false }, orderBy: { updatedAt: 'asc' }, take: 1 } },
        });
        if (!enrollment)
            throw Object.assign(new Error('Not enrolled'), { statusCode: 403 });
        if (enrollment.lessonProgress.length > 0) {
            const lesson = await database_1.prisma.lesson.findUnique({
                where: { id: enrollment.lessonProgress[0].lessonId },
                include: { module: true },
            });
            return lesson;
        }
        // Return first lesson if no progress
        const firstLesson = await database_1.prisma.lesson.findFirst({
            where: { module: { courseId }, isPublished: true },
            orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
            include: { module: true },
        });
        return firstLesson;
    }
}
exports.EnrollmentService = EnrollmentService;
exports.enrollmentService = new EnrollmentService();
//# sourceMappingURL=enrollment.service.js.map