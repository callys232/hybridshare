import { z } from 'zod';

export const CreateCourseSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
  language: z.string().default('en'),
  price: z.number().min(0).default(0),
  discountPrice: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  isFree: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  categoryId: z.string().optional(),
  outcomes: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  certificateEnabled: z.boolean().default(true),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

export const PublishCourseSchema = z.object({
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
});

export const CreateModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const UpdateModuleSchema = CreateModuleSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

export const CreateLessonSchema = z.object({
  moduleId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'LIVE_SESSION', 'SCORM', 'CODE_EXERCISE', 'INTERACTIVE', 'DOCUMENT', 'AUDIO']),
  sortOrder: z.number().int().min(0).default(0),
  durationMinutes: z.number().int().min(0).default(0),
  isFree: z.boolean().default(false),
  isPreview: z.boolean().default(false),
  videoUrl: z.string().url().optional(),
  videoProvider: z.string().optional(),
  videoPlaybackId: z.string().optional(),
  content: z.string().optional(),
  embedCode: z.string().optional(),
  xpReward: z.number().int().min(0).default(10),
});

export const UpdateLessonSchema = CreateLessonSchema.partial().omit({ moduleId: true }).extend({
  isPublished: z.boolean().optional(),
});

export const EnrollCourseSchema = z.object({
  courseId: z.string(),
  couponCode: z.string().optional(),
  cohortId: z.string().optional(),
});

export const UpdateLessonProgressSchema = z.object({
  lessonId: z.string(),
  watchedSeconds: z.number().int().min(0).optional(),
  totalSeconds: z.number().int().min(0).optional(),
  lastPosition: z.number().int().min(0).optional(),
  isCompleted: z.boolean().optional(),
});

export const SubmitQuizSchema = z.object({
  quizId: z.string(),
  enrollmentId: z.string().optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOptionIds: z.array(z.string()).default([]),
    textAnswer: z.string().optional(),
  })),
  timeSpent: z.number().int().min(0).default(0),
});

export const CreateQuizSchema = z.object({
  lessonId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['GRADED', 'PRACTICE', 'SURVEY', 'ASSESSMENT']).default('GRADED'),
  timeLimit: z.number().int().min(1).optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  maxAttempts: z.number().int().min(1).optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showResults: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  showExplanations: z.boolean().default(true),
  xpReward: z.number().int().min(0).default(50),
  questions: z.array(z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'CODE', 'RATING']),
    question: z.string().min(1),
    explanation: z.string().optional(),
    imageUrl: z.string().url().optional(),
    points: z.number().int().min(1).default(1),
    sortOrder: z.number().int().min(0).default(0),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean().default(false),
      explanation: z.string().optional(),
      sortOrder: z.number().int().min(0).default(0),
    })).optional(),
  })).default([]),
});

export const CourseReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
});

export const CreateLearningPathSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().optional(),
  description: z.string().max(3000).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
  tags: z.array(z.string()).default([]),
  courseIds: z.array(z.string()).default([]),
});

export const AssignmentSubmissionSchema = z.object({
  assignmentId: z.string(),
  content: z.string().optional(),
  fileUrls: z.array(z.string()).default([]),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CreateModuleInput = z.infer<typeof CreateModuleSchema>;
export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;
export type EnrollCourseInput = z.infer<typeof EnrollCourseSchema>;
export type SubmitQuizInput = z.infer<typeof SubmitQuizSchema>;
export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;
export type CourseReviewInput = z.infer<typeof CourseReviewSchema>;
export type CreateLearningPathInput = z.infer<typeof CreateLearningPathSchema>;
export type AssignmentSubmissionInput = z.infer<typeof AssignmentSubmissionSchema>;
export type UpdateLessonProgressInput = z.infer<typeof UpdateLessonProgressSchema>;
