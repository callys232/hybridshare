import { Router } from 'express';
import { courseController } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const courseRouter = Router();

// Public
courseRouter.get('/', courseController.list);
courseRouter.get('/categories', courseController.getCategories);
courseRouter.get('/:id', courseController.getById);
courseRouter.get('/slug/:slug', courseController.getBySlug);
courseRouter.get('/:id/reviews', courseController.getReviews);

// Auth required
courseRouter.use(authenticate);
courseRouter.get('/my/enrolled', courseController.getMyCourses);
courseRouter.get('/my/created', courseController.getInstructorCourses);
courseRouter.post('/:id/enroll', courseController.enroll);
courseRouter.post('/:id/reviews', courseController.createReview);
courseRouter.post('/:id/review-helpful/:reviewId', courseController.markReviewHelpful);

// Instructor/Admin
courseRouter.post('/', courseController.create);
courseRouter.put('/:id', courseController.update);
courseRouter.patch('/:id/publish', courseController.publish);
courseRouter.patch('/:id/archive', courseController.archive);
courseRouter.delete('/:id', courseController.delete);
courseRouter.get('/:id/stats', courseController.stats);

// Modules
courseRouter.post('/:id/modules', courseController.createModule);
courseRouter.put('/:id/modules/:moduleId', courseController.updateModule);
courseRouter.delete('/:id/modules/:moduleId', courseController.deleteModule);
courseRouter.patch('/:id/modules/reorder', courseController.reorderModules);

// Lessons
courseRouter.post('/lessons', courseController.createLesson);
courseRouter.put('/lessons/:lessonId', courseController.updateLesson);
courseRouter.delete('/lessons/:lessonId', courseController.deleteLesson);
courseRouter.patch('/modules/:moduleId/lessons/reorder', courseController.reorderLessons);
