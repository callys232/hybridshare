import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { enrollmentService } from '../services/enrollment.service';
import { eventService } from '../services/event.service';
import type { Request, Response, NextFunction } from 'express';
import { UpdateLessonProgressSchema, SubmitQuizSchema, AssignmentSubmissionSchema } from '@hybridshare/shared/schemas/course.schema';

export const enrollmentRouter = Router();
enrollmentRouter.use(authenticate);

const ok = (res: Response, data: unknown, code = 200) => res.status(code).json({ success: true, data, error: null });
const getUserId = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

enrollmentRouter.get('/', async (req, res, next) => {
  try { ok(res, await enrollmentService['getEnrollmentDetails']); } catch (e) { next(e); }
});

enrollmentRouter.get('/courses/:courseId', async (req, res, next) => {
  try { ok(res, await enrollmentService.getEnrollmentDetails(getUserId(req), req.params.courseId)); } catch (e) { next(e); }
});

enrollmentRouter.get('/courses/:courseId/next', async (req, res, next) => {
  try { ok(res, await enrollmentService.getNextLesson(getUserId(req), req.params.courseId)); } catch (e) { next(e); }
});

enrollmentRouter.post('/progress', async (req, res, next) => {
  try {
    const input = UpdateLessonProgressSchema.parse(req.body);
    const userId = getUserId(req);
    const result = await enrollmentService.updateLessonProgress(userId, input);
    await eventService.track({ event: 'lesson_progress_updated', properties: { lessonId: input.lessonId, percentage: input.watchedSeconds } }, userId, req.ip);
    ok(res, result);
  } catch (e) { next(e); }
});

enrollmentRouter.post('/quiz/submit', async (req, res, next) => {
  try {
    const input = SubmitQuizSchema.parse(req.body);
    const userId = getUserId(req);
    const result = await enrollmentService.submitQuiz(userId, input);
    await eventService.track({
      event: result.isPassed ? 'quiz_passed' : 'quiz_failed',
      properties: { quizId: input.quizId, score: result.percentage },
    }, userId, req.ip);
    ok(res, result);
  } catch (e) { next(e); }
});

enrollmentRouter.post('/assignment/submit', async (req, res, next) => {
  try {
    const input = AssignmentSubmissionSchema.parse(req.body);
    const result = await enrollmentService.submitAssignment(getUserId(req), input);
    ok(res, result, 201);
  } catch (e) { next(e); }
});

enrollmentRouter.patch('/:id/drop', async (req, res, next) => {
  try {
    const { prisma } = await import('../config/database');
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: req.params.id, userId: getUserId(req) },
    });
    if (!enrollment) return next(Object.assign(new Error('Enrollment not found'), { statusCode: 404 }));
    const updated = await prisma.enrollment.update({ where: { id: req.params.id }, data: { status: 'DROPPED' } });
    ok(res, updated);
  } catch (e) { next(e); }
});
