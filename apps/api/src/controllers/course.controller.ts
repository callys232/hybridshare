import type { Request, Response, NextFunction } from 'express';
import { courseService } from '../services/course.service';
import { enrollmentService } from '../services/enrollment.service';
import { eventService } from '../services/event.service';
import { paymentService } from '../services/payment.service';
import { validate } from '../middleware/validate.middleware';
import {
  CreateCourseSchema, UpdateCourseSchema, CreateModuleSchema,
  UpdateModuleSchema, CreateLessonSchema, UpdateLessonSchema,
  EnrollCourseSchema, CourseReviewSchema,
} from '@hybridshare/shared/schemas/course.schema';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, error: null });

const fail = (next: NextFunction, err: unknown) => next(err);

export const courseController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { sub: string } }).user?.sub;
      const result = await courseService.listCourses(req.query as never, userId);
      ok(res, result);
    } catch (e) { fail(next, e); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { sub: string } }).user?.sub;
      const course = await courseService.getCourse(req.params.id, userId);
      if (userId) {
        await eventService.track({ event: 'course_viewed', properties: { courseId: req.params.id } }, userId, req.ip);
      }
      ok(res, course);
    } catch (e) { fail(next, e); }
  },

  getBySlug: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { sub: string } }).user?.sub;
      const course = await courseService.getCourseBySlug(req.params.slug, userId);
      ok(res, course);
    } catch (e) { fail(next, e); }
  },

  getCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try { ok(res, await courseService.getCategories()); } catch (e) { fail(next, e); }
  },

  getMyCourses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      ok(res, await enrollmentService['getEnrollmentDetails'] ? await courseService.getMyCourses(userId, req.query as never) : []);
    } catch (e) { fail(next, e); }
  },

  getInstructorCourses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      ok(res, await courseService.getInstructorCourses(userId, req.query as never));
    } catch (e) { fail(next, e); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      const input = CreateCourseSchema.parse(req.body);
      const course = await courseService.createCourse(userId, input);
      ok(res, course, 201);
    } catch (e) { fail(next, e); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      const input = UpdateCourseSchema.parse(req.body);
      ok(res, await courseService.updateCourse(req.params.id, userId, input));
    } catch (e) { fail(next, e); }
  },

  publish: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      ok(res, await courseService.publishCourse(req.params.id, userId));
    } catch (e) { fail(next, e); }
  },

  archive: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      ok(res, await courseService.archiveCourse(req.params.id, userId));
    } catch (e) { fail(next, e); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      await courseService.deleteCourse(req.params.id, userId);
      ok(res, { deleted: true });
    } catch (e) { fail(next, e); }
  },

  stats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      ok(res, await courseService.getCourseStats(req.params.id, userId));
    } catch (e) { fail(next, e); }
  },

  enroll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      const { couponCode, cohortId } = EnrollCourseSchema.parse({ ...req.body, courseId: req.params.id });
      // If paid course, create checkout session
      const course = await courseService.getCourse(req.params.id);
      if (!course.isFree && Number(course.price) > 0) {
        const session = await paymentService.createCheckoutSession(userId, req.params.id, couponCode);
        return ok(res, { requiresPayment: true, checkout: session });
      }
      const enrollment = await enrollmentService.enrollFree(userId, req.params.id, cohortId);
      await eventService.track({ event: 'course_enrolled', properties: { courseId: req.params.id } }, userId, req.ip);
      ok(res, enrollment, 201);
    } catch (e) { fail(next, e); }
  },

  createReview: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      const input = CourseReviewSchema.parse(req.body);
      ok(res, await courseService.createReview(req.params.id, userId, input), 201);
    } catch (e) { fail(next, e); }
  },

  getReviews: async (req: Request, res: Response, next: NextFunction) => {
    try { ok(res, await courseService.getReviews(req.params.id, req.query as never)); } catch (e) { fail(next, e); }
  },

  markReviewHelpful: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../config/database');
      await prisma.courseReview.update({
        where: { id: req.params.reviewId },
        data: { helpfulCount: { increment: 1 } },
      });
      ok(res, { success: true });
    } catch (e) { fail(next, e); }
  },

  // Modules
  createModule: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      const input = CreateModuleSchema.parse(req.body);
      ok(res, await courseService.createModule(req.params.id, userId, input), 201);
    } catch (e) { fail(next, e); }
  },

  updateModule: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      ok(res, await courseService.updateModule(req.params.moduleId, userId, req.body));
    } catch (e) { fail(next, e); }
  },

  deleteModule: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      await courseService.deleteModule(req.params.moduleId, userId);
      ok(res, { deleted: true });
    } catch (e) { fail(next, e); }
  },

  reorderModules: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      await courseService.reorderModules(req.params.id, userId, req.body.order);
      ok(res, { reordered: true });
    } catch (e) { fail(next, e); }
  },

  // Lessons
  createLesson: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      const input = CreateLessonSchema.parse(req.body);
      ok(res, await courseService.createLesson(userId, input), 201);
    } catch (e) { fail(next, e); }
  },

  updateLesson: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      ok(res, await courseService.updateLesson(req.params.lessonId, userId, req.body));
    } catch (e) { fail(next, e); }
  },

  deleteLesson: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      await courseService.deleteLesson(req.params.lessonId, userId);
      ok(res, { deleted: true });
    } catch (e) { fail(next, e); }
  },

  reorderLessons: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user: { sub: string } }).user.sub;
      await courseService.reorderLessons(req.params.moduleId, userId, req.body.order);
      ok(res, { reordered: true });
    } catch (e) { fail(next, e); }
  },
};
