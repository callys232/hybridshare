import { prisma } from '../config/database';
import { notificationService } from './notification.service';
import { gamificationService } from './gamification.service';
import { emailService } from './email.service';
import { emitToUser } from '../config/socket';
import { logger } from '../utils/logger';
import type { UpdateLessonProgressInput, SubmitQuizInput, AssignmentSubmissionInput } from '@hybridshare/shared/schemas/course.schema';

export class EnrollmentService {
  // ─── Enrollment ───────────────────────────────────────────────────────────

  async enrollFree(userId: string, courseId: string, cohortId?: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
    if (!course.isFree && course.price > 0) {
      throw Object.assign(new Error('This course requires payment'), { statusCode: 402 });
    }
    return this.createEnrollment(userId, courseId, 'direct', cohortId);
  }

  async enrollAfterPayment(userId: string, courseId: string, paymentId: string) {
    return this.createEnrollment(userId, courseId, 'purchase', undefined, paymentId);
  }

  private async createEnrollment(
    userId: string, courseId: string, enrolledVia: string,
    cohortId?: string, paymentId?: string
  ) {
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      if (existing.status === 'ACTIVE' || existing.status === 'COMPLETED') {
        throw Object.assign(new Error('Already enrolled'), { statusCode: 409 });
      }
      // Re-activate dropped enrollment
      return prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', lastAccessedAt: new Date() },
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { modules: true } } },
    });
    if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });

    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId }, isPublished: true },
    });

    const enrollment = await prisma.enrollment.create({
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
    await prisma.course.update({
      where: { id: courseId },
      data: { totalStudents: { increment: 1 } },
    });

    // Award XP
    await gamificationService.awardXP(userId, 'COURSE_ENROLLED', { courseId });

    // Send enrollment confirmation email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendEnrollmentConfirmation(user.email, user.name, course.title, course.slug);
    }

    // Notify instructor
    if (course.instructorId) {
      const instructor = await prisma.instructorProfile.findUnique({
        where: { id: course.instructorId },
        include: { user: true },
      });
      if (instructor) {
        await notificationService.create(instructor.userId, {
          type: 'new_enrollment',
          title: 'New Student Enrolled',
          message: `A new student enrolled in "${course.title}"`,
          resourceType: 'course',
          resourceId: courseId,
        });
      }
    }

    emitToUser(userId, 'enrollment:created', { courseId, enrollmentId: enrollment.id });
    logger.info('Enrollment created', { userId, courseId, enrollmentId: enrollment.id });
    return enrollment;
  }

  // ─── Progress Tracking ────────────────────────────────────────────────────

  async updateLessonProgress(userId: string, input: UpdateLessonProgressInput) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: input.lessonId },
      include: { module: true },
    });
    if (!lesson) throw Object.assign(new Error('Lesson not found'), { statusCode: 404 });

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
    });
    if (!enrollment) throw Object.assign(new Error('Not enrolled'), { statusCode: 403 });

    const existing = await prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: input.lessonId } },
    });

    const watchPercentage = input.totalSeconds && input.watchedSeconds
      ? Math.round((input.watchedSeconds / input.totalSeconds) * 100)
      : existing?.watchPercentage ?? 0;

    const willComplete = input.isCompleted || watchPercentage >= 85;
    const wasAlreadyCompleted = existing?.isCompleted ?? false;

    const progress = await prisma.lessonProgress.upsert({
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
      await gamificationService.awardXP(userId, 'LESSON_COMPLETED', { lessonId: input.lessonId, xp: lesson.xpReward });
    }

    return progress;
  }

  private async recalcEnrollmentProgress(enrollmentId: string, courseId: string, userId: string) {
    const [completedCount, totalCount] = await Promise.all([
      prisma.lessonProgress.count({ where: { enrollmentId, isCompleted: true } }),
      prisma.lesson.count({ where: { module: { courseId }, isPublished: true } }),
    ]);

    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isCompleted = progress === 100;

    const enrollment = await prisma.enrollment.update({
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

  private async handleCourseCompletion(userId: string, courseId: string, enrollmentId: string) {
    const [course, user] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!course || !user) return;

    // Award XP
    await gamificationService.awardXP(userId, 'COURSE_COMPLETED', { courseId });

    // Issue certificate if enabled
    if (course.certificateEnabled) {
      const template = await prisma.certificateTemplate.findUnique({ where: { courseId } });
      await prisma.userCertificate.upsert({
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

      await gamificationService.awardXP(userId, 'CERTIFICATE_EARNED', { courseId });
    }

    // Send completion email
    await emailService.sendCourseCompletionEmail(user.email, user.name, course.title, course.slug);

    // Emit real-time event
    emitToUser(userId, 'course:completed', { courseId, enrollmentId });

    // Notify instructor
    if (course.instructorId) {
      const instructor = await prisma.instructorProfile.findUnique({ where: { id: course.instructorId } });
      if (instructor) {
        await notificationService.create(instructor.userId, {
          type: 'course_completed',
          title: 'Student Completed Course',
          message: `${user.name} completed "${course.title}"`,
          resourceType: 'course',
          resourceId: courseId,
        });
      }
    }

    logger.info('Course completed', { userId, courseId, enrollmentId });
  }

  // ─── Quiz Submission ──────────────────────────────────────────────────────

  async submitQuiz(userId: string, input: SubmitQuizInput) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: input.quizId },
      include: {
        questions: { include: { options: true } },
        lesson: { include: { module: true } },
      },
    });
    if (!quiz) throw Object.assign(new Error('Quiz not found'), { statusCode: 404 });

    // Check attempt limit
    if (quiz.maxAttempts) {
      const attemptCount = await prisma.quizAttempt.count({
        where: { quizId: input.quizId, userId },
      });
      if (attemptCount >= quiz.maxAttempts) {
        throw Object.assign(new Error(`Maximum ${quiz.maxAttempts} attempts reached`), { statusCode: 429 });
      }
    }

    const attemptNumber = (await prisma.quizAttempt.count({ where: { quizId: input.quizId, userId } })) + 1;

    // Grade the quiz
    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers: {
      questionId: string; selectedOptionIds: string[]; textAnswer?: string;
      isCorrect: boolean; points: number;
    }[] = [];

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
      } else if (question.type === 'MULTIPLE_CHOICE') {
        const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
        const selectedIds = new Set(answer.selectedOptionIds);
        isCorrect = correctIds.size === selectedIds.size && [...correctIds].every((id) => selectedIds.has(id));
        earned = isCorrect ? question.points : 0;
      } else {
        // Short/long answer — mark as pending for manual grading
        earned = 0;
      }

      totalScore += earned;
      gradedAnswers.push({ ...answer, isCorrect, points: earned });
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassed = percentage >= quiz.passingScore;

    const attempt = await prisma.quizAttempt.create({
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
      await gamificationService.awardXP(userId, xpEvent, { quizId: input.quizId, score: percentage });
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

  async submitAssignment(userId: string, input: AssignmentSubmissionInput) {
    const assignment = await prisma.assignment.findUnique({ where: { id: input.assignmentId } });
    if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });

    const existing = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId: input.assignmentId, userId, status: { notIn: ['RESUBMIT'] } },
    });

    if (existing && !['RESUBMIT', 'GRADED'].includes(existing.status)) {
      throw Object.assign(new Error('Already submitted'), { statusCode: 409 });
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: input.assignmentId,
        userId,
        content: input.content,
        fileUrls: input.fileUrls,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    await gamificationService.awardXP(userId, 'ASSIGNMENT_SUBMITTED', { assignmentId: input.assignmentId });

    return submission;
  }

  // ─── Get Progress ─────────────────────────────────────────────────────────

  async getEnrollmentDetails(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
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

    if (!enrollment) throw Object.assign(new Error('Enrollment not found'), { statusCode: 404 });
    return enrollment;
  }

  async getNextLesson(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { lessonProgress: { where: { isCompleted: false }, orderBy: { updatedAt: 'asc' }, take: 1 } },
    });

    if (!enrollment) throw Object.assign(new Error('Not enrolled'), { statusCode: 403 });

    if (enrollment.lessonProgress.length > 0) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: enrollment.lessonProgress[0].lessonId },
        include: { module: true },
      });
      return lesson;
    }

    // Return first lesson if no progress
    const firstLesson = await prisma.lesson.findFirst({
      where: { module: { courseId }, isPublished: true },
      orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { module: true },
    });

    return firstLesson;
  }
}

export const enrollmentService = new EnrollmentService();
