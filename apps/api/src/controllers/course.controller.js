"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseController = void 0;
const course_service_1 = require("../services/course.service");
const enrollment_service_1 = require("../services/enrollment.service");
const event_service_1 = require("../services/event.service");
const payment_service_1 = require("../services/payment.service");
const course_schema_1 = require("@hybridshare/shared/schemas/course.schema");
const ok = (res, data, statusCode = 200) => res.status(statusCode).json({ success: true, data, error: null });
const fail = (next, err) => next(err);
exports.courseController = {
    list: async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            const result = await course_service_1.courseService.listCourses(req.query, userId);
            ok(res, result);
        }
        catch (e) {
            fail(next, e);
        }
    },
    getById: async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            const course = await course_service_1.courseService.getCourse(req.params.id, userId);
            if (userId) {
                await event_service_1.eventService.track({ event: 'course_viewed', properties: { courseId: req.params.id } }, userId, req.ip);
            }
            ok(res, course);
        }
        catch (e) {
            fail(next, e);
        }
    },
    getBySlug: async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            const course = await course_service_1.courseService.getCourseBySlug(req.params.slug, userId);
            ok(res, course);
        }
        catch (e) {
            fail(next, e);
        }
    },
    getCategories: async (_req, res, next) => {
        try {
            ok(res, await course_service_1.courseService.getCategories());
        }
        catch (e) {
            fail(next, e);
        }
    },
    getMyCourses: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            ok(res, await enrollment_service_1.enrollmentService['getEnrollmentDetails'] ? await course_service_1.courseService.getMyCourses(userId, req.query) : []);
        }
        catch (e) {
            fail(next, e);
        }
    },
    getInstructorCourses: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            ok(res, await course_service_1.courseService.getInstructorCourses(userId, req.query));
        }
        catch (e) {
            fail(next, e);
        }
    },
    create: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const input = course_schema_1.CreateCourseSchema.parse(req.body);
            const course = await course_service_1.courseService.createCourse(userId, input);
            ok(res, course, 201);
        }
        catch (e) {
            fail(next, e);
        }
    },
    update: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const input = course_schema_1.UpdateCourseSchema.parse(req.body);
            ok(res, await course_service_1.courseService.updateCourse(req.params.id, userId, input));
        }
        catch (e) {
            fail(next, e);
        }
    },
    publish: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            ok(res, await course_service_1.courseService.publishCourse(req.params.id, userId));
        }
        catch (e) {
            fail(next, e);
        }
    },
    archive: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            ok(res, await course_service_1.courseService.archiveCourse(req.params.id, userId));
        }
        catch (e) {
            fail(next, e);
        }
    },
    delete: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            await course_service_1.courseService.deleteCourse(req.params.id, userId);
            ok(res, { deleted: true });
        }
        catch (e) {
            fail(next, e);
        }
    },
    stats: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            ok(res, await course_service_1.courseService.getCourseStats(req.params.id, userId));
        }
        catch (e) {
            fail(next, e);
        }
    },
    enroll: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const { couponCode, cohortId } = course_schema_1.EnrollCourseSchema.parse({ ...req.body, courseId: req.params.id });
            // If paid course, create checkout session
            const course = await course_service_1.courseService.getCourse(req.params.id);
            if (!course.isFree && Number(course.price) > 0) {
                const session = await payment_service_1.paymentService.createCheckoutSession(userId, req.params.id, couponCode);
                return ok(res, { requiresPayment: true, checkout: session });
            }
            const enrollment = await enrollment_service_1.enrollmentService.enrollFree(userId, req.params.id, cohortId);
            await event_service_1.eventService.track({ event: 'course_enrolled', properties: { courseId: req.params.id } }, userId, req.ip);
            ok(res, enrollment, 201);
        }
        catch (e) {
            fail(next, e);
        }
    },
    createReview: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const input = course_schema_1.CourseReviewSchema.parse(req.body);
            ok(res, await course_service_1.courseService.createReview(req.params.id, userId, input), 201);
        }
        catch (e) {
            fail(next, e);
        }
    },
    getReviews: async (req, res, next) => {
        try {
            ok(res, await course_service_1.courseService.getReviews(req.params.id, req.query));
        }
        catch (e) {
            fail(next, e);
        }
    },
    markReviewHelpful: async (req, res, next) => {
        try {
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
            await prisma.courseReview.update({
                where: { id: req.params.reviewId },
                data: { helpfulCount: { increment: 1 } },
            });
            ok(res, { success: true });
        }
        catch (e) {
            fail(next, e);
        }
    },
    // Modules
    createModule: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const input = course_schema_1.CreateModuleSchema.parse(req.body);
            ok(res, await course_service_1.courseService.createModule(req.params.id, userId, input), 201);
        }
        catch (e) {
            fail(next, e);
        }
    },
    updateModule: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            ok(res, await course_service_1.courseService.updateModule(req.params.moduleId, userId, req.body));
        }
        catch (e) {
            fail(next, e);
        }
    },
    deleteModule: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            await course_service_1.courseService.deleteModule(req.params.moduleId, userId);
            ok(res, { deleted: true });
        }
        catch (e) {
            fail(next, e);
        }
    },
    reorderModules: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            await course_service_1.courseService.reorderModules(req.params.id, userId, req.body.order);
            ok(res, { reordered: true });
        }
        catch (e) {
            fail(next, e);
        }
    },
    // Lessons
    createLesson: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const input = course_schema_1.CreateLessonSchema.parse(req.body);
            ok(res, await course_service_1.courseService.createLesson(userId, input), 201);
        }
        catch (e) {
            fail(next, e);
        }
    },
    updateLesson: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            ok(res, await course_service_1.courseService.updateLesson(req.params.lessonId, userId, req.body));
        }
        catch (e) {
            fail(next, e);
        }
    },
    deleteLesson: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            await course_service_1.courseService.deleteLesson(req.params.lessonId, userId);
            ok(res, { deleted: true });
        }
        catch (e) {
            fail(next, e);
        }
    },
    reorderLessons: async (req, res, next) => {
        try {
            const userId = req.user.sub;
            await course_service_1.courseService.reorderLessons(req.params.moduleId, userId, req.body.order);
            ok(res, { reordered: true });
        }
        catch (e) {
            fail(next, e);
        }
    },
};
//# sourceMappingURL=course.controller.js.map