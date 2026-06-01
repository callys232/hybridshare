"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentSubmissionSchema = exports.CreateLearningPathSchema = exports.CourseReviewSchema = exports.CreateQuizSchema = exports.SubmitQuizSchema = exports.UpdateLessonProgressSchema = exports.EnrollCourseSchema = exports.UpdateLessonSchema = exports.CreateLessonSchema = exports.UpdateModuleSchema = exports.CreateModuleSchema = exports.PublishCourseSchema = exports.UpdateCourseSchema = exports.CreateCourseSchema = void 0;
const zod_1 = require("zod");
exports.CreateCourseSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(200),
    slug: zod_1.z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
    description: zod_1.z.string().max(5000).optional(),
    shortDescription: zod_1.z.string().max(300).optional(),
    level: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
    language: zod_1.z.string().default('en'),
    price: zod_1.z.number().min(0).default(0),
    discountPrice: zod_1.z.number().min(0).optional(),
    currency: zod_1.z.string().default('USD'),
    isFree: zod_1.z.boolean().default(false),
    isPublic: zod_1.z.boolean().default(true),
    categoryId: zod_1.z.string().optional(),
    outcomes: zod_1.z.array(zod_1.z.string()).default([]),
    requirements: zod_1.z.array(zod_1.z.string()).default([]),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    certificateEnabled: zod_1.z.boolean().default(true),
});
exports.UpdateCourseSchema = exports.CreateCourseSchema.partial();
exports.PublishCourseSchema = zod_1.z.object({
    status: zod_1.z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
});
exports.CreateModuleSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    sortOrder: zod_1.z.number().int().min(0).default(0),
});
exports.UpdateModuleSchema = exports.CreateModuleSchema.partial().extend({
    isPublished: zod_1.z.boolean().optional(),
});
exports.CreateLessonSchema = zod_1.z.object({
    moduleId: zod_1.z.string(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    type: zod_1.z.enum(['VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'LIVE_SESSION', 'SCORM', 'CODE_EXERCISE', 'INTERACTIVE', 'DOCUMENT', 'AUDIO']),
    sortOrder: zod_1.z.number().int().min(0).default(0),
    durationMinutes: zod_1.z.number().int().min(0).default(0),
    isFree: zod_1.z.boolean().default(false),
    isPreview: zod_1.z.boolean().default(false),
    videoUrl: zod_1.z.string().url().optional(),
    videoProvider: zod_1.z.string().optional(),
    videoPlaybackId: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    embedCode: zod_1.z.string().optional(),
    xpReward: zod_1.z.number().int().min(0).default(10),
});
exports.UpdateLessonSchema = exports.CreateLessonSchema.partial().omit({ moduleId: true }).extend({
    isPublished: zod_1.z.boolean().optional(),
});
exports.EnrollCourseSchema = zod_1.z.object({
    courseId: zod_1.z.string(),
    couponCode: zod_1.z.string().optional(),
    cohortId: zod_1.z.string().optional(),
});
exports.UpdateLessonProgressSchema = zod_1.z.object({
    lessonId: zod_1.z.string(),
    watchedSeconds: zod_1.z.number().int().min(0).optional(),
    totalSeconds: zod_1.z.number().int().min(0).optional(),
    lastPosition: zod_1.z.number().int().min(0).optional(),
    isCompleted: zod_1.z.boolean().optional(),
});
exports.SubmitQuizSchema = zod_1.z.object({
    quizId: zod_1.z.string(),
    enrollmentId: zod_1.z.string().optional(),
    answers: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string(),
        selectedOptionIds: zod_1.z.array(zod_1.z.string()).default([]),
        textAnswer: zod_1.z.string().optional(),
    })),
    timeSpent: zod_1.z.number().int().min(0).default(0),
});
exports.CreateQuizSchema = zod_1.z.object({
    lessonId: zod_1.z.string(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['GRADED', 'PRACTICE', 'SURVEY', 'ASSESSMENT']).default('GRADED'),
    timeLimit: zod_1.z.number().int().min(1).optional(),
    passingScore: zod_1.z.number().int().min(0).max(100).default(70),
    maxAttempts: zod_1.z.number().int().min(1).optional(),
    shuffleQuestions: zod_1.z.boolean().default(false),
    shuffleOptions: zod_1.z.boolean().default(false),
    showResults: zod_1.z.boolean().default(true),
    showCorrectAnswers: zod_1.z.boolean().default(true),
    showExplanations: zod_1.z.boolean().default(true),
    xpReward: zod_1.z.number().int().min(0).default(50),
    questions: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'CODE', 'RATING']),
        question: zod_1.z.string().min(1),
        explanation: zod_1.z.string().optional(),
        imageUrl: zod_1.z.string().url().optional(),
        points: zod_1.z.number().int().min(1).default(1),
        sortOrder: zod_1.z.number().int().min(0).default(0),
        options: zod_1.z.array(zod_1.z.object({
            text: zod_1.z.string().min(1),
            isCorrect: zod_1.z.boolean().default(false),
            explanation: zod_1.z.string().optional(),
            sortOrder: zod_1.z.number().int().min(0).default(0),
        })).optional(),
    })).default([]),
});
exports.CourseReviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    title: zod_1.z.string().max(200).optional(),
    content: zod_1.z.string().max(2000).optional(),
});
exports.CreateLearningPathSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    slug: zod_1.z.string().optional(),
    description: zod_1.z.string().max(3000).optional(),
    level: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    courseIds: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.AssignmentSubmissionSchema = zod_1.z.object({
    assignmentId: zod_1.z.string(),
    content: zod_1.z.string().optional(),
    fileUrls: zod_1.z.array(zod_1.z.string()).default([]),
});
//# sourceMappingURL=course.schema.js.map