"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRouter = void 0;
const express_1 = require("express");
const course_controller_1 = require("../controllers/course.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
exports.courseRouter = (0, express_1.Router)();
// Public
exports.courseRouter.get('/', course_controller_1.courseController.list);
exports.courseRouter.get('/categories', course_controller_1.courseController.getCategories);
exports.courseRouter.get('/:id', course_controller_1.courseController.getById);
exports.courseRouter.get('/slug/:slug', course_controller_1.courseController.getBySlug);
exports.courseRouter.get('/:id/reviews', course_controller_1.courseController.getReviews);
// Auth required
exports.courseRouter.use(auth_middleware_1.authenticate);
exports.courseRouter.get('/my/enrolled', course_controller_1.courseController.getMyCourses);
exports.courseRouter.get('/my/created', course_controller_1.courseController.getInstructorCourses);
exports.courseRouter.post('/:id/enroll', course_controller_1.courseController.enroll);
exports.courseRouter.post('/:id/reviews', course_controller_1.courseController.createReview);
exports.courseRouter.post('/:id/review-helpful/:reviewId', course_controller_1.courseController.markReviewHelpful);
// Instructor/Admin
exports.courseRouter.post('/', course_controller_1.courseController.create);
exports.courseRouter.put('/:id', course_controller_1.courseController.update);
exports.courseRouter.patch('/:id/publish', course_controller_1.courseController.publish);
exports.courseRouter.patch('/:id/archive', course_controller_1.courseController.archive);
exports.courseRouter.delete('/:id', course_controller_1.courseController.delete);
exports.courseRouter.get('/:id/stats', course_controller_1.courseController.stats);
// Modules
exports.courseRouter.post('/:id/modules', course_controller_1.courseController.createModule);
exports.courseRouter.put('/:id/modules/:moduleId', course_controller_1.courseController.updateModule);
exports.courseRouter.delete('/:id/modules/:moduleId', course_controller_1.courseController.deleteModule);
exports.courseRouter.patch('/:id/modules/reorder', course_controller_1.courseController.reorderModules);
// Lessons
exports.courseRouter.post('/lessons', course_controller_1.courseController.createLesson);
exports.courseRouter.put('/lessons/:lessonId', course_controller_1.courseController.updateLesson);
exports.courseRouter.delete('/lessons/:lessonId', course_controller_1.courseController.deleteLesson);
exports.courseRouter.patch('/modules/:moduleId/lessons/reorder', course_controller_1.courseController.reorderLessons);
//# sourceMappingURL=course.routes.js.map