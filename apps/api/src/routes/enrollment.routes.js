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
exports.enrollmentRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const enrollment_service_1 = require("../services/enrollment.service");
const event_service_1 = require("../services/event.service");
const course_schema_1 = require("@hybridshare/shared/schemas/course.schema");
exports.enrollmentRouter = (0, express_1.Router)();
exports.enrollmentRouter.use(auth_middleware_1.authenticate);
const ok = (res, data, code = 200) => res.status(code).json({ success: true, data, error: null });
const getUserId = (req) => req.user.sub;
exports.enrollmentRouter.get('/', async (req, res, next) => {
    try {
        ok(res, await enrollment_service_1.enrollmentService['getEnrollmentDetails']);
    }
    catch (e) {
        next(e);
    }
});
exports.enrollmentRouter.get('/courses/:courseId', async (req, res, next) => {
    try {
        ok(res, await enrollment_service_1.enrollmentService.getEnrollmentDetails(getUserId(req), req.params.courseId));
    }
    catch (e) {
        next(e);
    }
});
exports.enrollmentRouter.get('/courses/:courseId/next', async (req, res, next) => {
    try {
        ok(res, await enrollment_service_1.enrollmentService.getNextLesson(getUserId(req), req.params.courseId));
    }
    catch (e) {
        next(e);
    }
});
exports.enrollmentRouter.post('/progress', async (req, res, next) => {
    try {
        const input = course_schema_1.UpdateLessonProgressSchema.parse(req.body);
        const userId = getUserId(req);
        const result = await enrollment_service_1.enrollmentService.updateLessonProgress(userId, input);
        await event_service_1.eventService.track({ event: 'lesson_progress_updated', properties: { lessonId: input.lessonId, percentage: input.watchedSeconds } }, userId, req.ip);
        ok(res, result);
    }
    catch (e) {
        next(e);
    }
});
exports.enrollmentRouter.post('/quiz/submit', async (req, res, next) => {
    try {
        const input = course_schema_1.SubmitQuizSchema.parse(req.body);
        const userId = getUserId(req);
        const result = await enrollment_service_1.enrollmentService.submitQuiz(userId, input);
        await event_service_1.eventService.track({
            event: result.isPassed ? 'quiz_passed' : 'quiz_failed',
            properties: { quizId: input.quizId, score: result.percentage },
        }, userId, req.ip);
        ok(res, result);
    }
    catch (e) {
        next(e);
    }
});
exports.enrollmentRouter.post('/assignment/submit', async (req, res, next) => {
    try {
        const input = course_schema_1.AssignmentSubmissionSchema.parse(req.body);
        const result = await enrollment_service_1.enrollmentService.submitAssignment(getUserId(req), input);
        ok(res, result, 201);
    }
    catch (e) {
        next(e);
    }
});
exports.enrollmentRouter.patch('/:id/drop', async (req, res, next) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const enrollment = await prisma.enrollment.findFirst({
            where: { id: req.params.id, userId: getUserId(req) },
        });
        if (!enrollment)
            return next(Object.assign(new Error('Enrollment not found'), { statusCode: 404 }));
        const updated = await prisma.enrollment.update({ where: { id: req.params.id }, data: { status: 'DROPPED' } });
        ok(res, updated);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=enrollment.routes.js.map