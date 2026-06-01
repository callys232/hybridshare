import { z } from 'zod';
export declare const CreateCourseSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodString>;
    level: z.ZodDefault<z.ZodEnum<["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]>>;
    language: z.ZodDefault<z.ZodString>;
    price: z.ZodDefault<z.ZodNumber>;
    discountPrice: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    isFree: z.ZodDefault<z.ZodBoolean>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    categoryId: z.ZodOptional<z.ZodString>;
    outcomes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    requirements: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    certificateEnabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
    title: string;
    tags: string[];
    isPublic: boolean;
    language: string;
    price: number;
    currency: string;
    isFree: boolean;
    outcomes: string[];
    requirements: string[];
    certificateEnabled: boolean;
    description?: string | undefined;
    slug?: string | undefined;
    shortDescription?: string | undefined;
    discountPrice?: number | undefined;
    categoryId?: string | undefined;
}, {
    title: string;
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    isPublic?: boolean | undefined;
    language?: string | undefined;
    slug?: string | undefined;
    shortDescription?: string | undefined;
    price?: number | undefined;
    discountPrice?: number | undefined;
    currency?: string | undefined;
    isFree?: boolean | undefined;
    categoryId?: string | undefined;
    outcomes?: string[] | undefined;
    requirements?: string[] | undefined;
    certificateEnabled?: boolean | undefined;
}>;
export declare const UpdateCourseSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    shortDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    level: z.ZodOptional<z.ZodDefault<z.ZodEnum<["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]>>>;
    language: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    price: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    discountPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    isFree: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isPublic: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    categoryId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    outcomes: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    requirements: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    certificateEnabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    isPublic?: boolean | undefined;
    language?: string | undefined;
    slug?: string | undefined;
    shortDescription?: string | undefined;
    price?: number | undefined;
    discountPrice?: number | undefined;
    currency?: string | undefined;
    isFree?: boolean | undefined;
    categoryId?: string | undefined;
    outcomes?: string[] | undefined;
    requirements?: string[] | undefined;
    certificateEnabled?: boolean | undefined;
}, {
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    isPublic?: boolean | undefined;
    language?: string | undefined;
    slug?: string | undefined;
    shortDescription?: string | undefined;
    price?: number | undefined;
    discountPrice?: number | undefined;
    currency?: string | undefined;
    isFree?: boolean | undefined;
    categoryId?: string | undefined;
    outcomes?: string[] | undefined;
    requirements?: string[] | undefined;
    certificateEnabled?: boolean | undefined;
}>;
export declare const PublishCourseSchema: z.ZodObject<{
    status: z.ZodEnum<["PUBLISHED", "DRAFT", "ARCHIVED"]>;
}, "strip", z.ZodTypeAny, {
    status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
}, {
    status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
}>;
export declare const CreateModuleSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    sortOrder: number;
    description?: string | undefined;
}, {
    title: string;
    description?: string | undefined;
    sortOrder?: number | undefined;
}>;
export declare const UpdateModuleSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
} & {
    isPublished: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    isPublished?: boolean | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    isPublished?: boolean | undefined;
}>;
export declare const CreateLessonSchema: z.ZodObject<{
    moduleId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["VIDEO", "ARTICLE", "QUIZ", "ASSIGNMENT", "LIVE_SESSION", "SCORM", "CODE_EXERCISE", "INTERACTIVE", "DOCUMENT", "AUDIO"]>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    durationMinutes: z.ZodDefault<z.ZodNumber>;
    isFree: z.ZodDefault<z.ZodBoolean>;
    isPreview: z.ZodDefault<z.ZodBoolean>;
    videoUrl: z.ZodOptional<z.ZodString>;
    videoProvider: z.ZodOptional<z.ZodString>;
    videoPlaybackId: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    embedCode: z.ZodOptional<z.ZodString>;
    xpReward: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "VIDEO" | "ARTICLE" | "QUIZ" | "ASSIGNMENT" | "LIVE_SESSION" | "SCORM" | "CODE_EXERCISE" | "INTERACTIVE" | "DOCUMENT" | "AUDIO";
    title: string;
    sortOrder: number;
    isFree: boolean;
    moduleId: string;
    durationMinutes: number;
    isPreview: boolean;
    xpReward: number;
    description?: string | undefined;
    content?: string | undefined;
    videoUrl?: string | undefined;
    videoProvider?: string | undefined;
    videoPlaybackId?: string | undefined;
    embedCode?: string | undefined;
}, {
    type: "VIDEO" | "ARTICLE" | "QUIZ" | "ASSIGNMENT" | "LIVE_SESSION" | "SCORM" | "CODE_EXERCISE" | "INTERACTIVE" | "DOCUMENT" | "AUDIO";
    title: string;
    moduleId: string;
    description?: string | undefined;
    content?: string | undefined;
    sortOrder?: number | undefined;
    isFree?: boolean | undefined;
    durationMinutes?: number | undefined;
    isPreview?: boolean | undefined;
    videoUrl?: string | undefined;
    videoProvider?: string | undefined;
    videoPlaybackId?: string | undefined;
    embedCode?: string | undefined;
    xpReward?: number | undefined;
}>;
export declare const UpdateLessonSchema: z.ZodObject<Omit<{
    moduleId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<["VIDEO", "ARTICLE", "QUIZ", "ASSIGNMENT", "LIVE_SESSION", "SCORM", "CODE_EXERCISE", "INTERACTIVE", "DOCUMENT", "AUDIO"]>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    durationMinutes: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isFree: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isPreview: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    videoUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    videoProvider: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    videoPlaybackId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    content: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    embedCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    xpReward: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "moduleId"> & {
    isPublished: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "VIDEO" | "ARTICLE" | "QUIZ" | "ASSIGNMENT" | "LIVE_SESSION" | "SCORM" | "CODE_EXERCISE" | "INTERACTIVE" | "DOCUMENT" | "AUDIO" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    content?: string | undefined;
    sortOrder?: number | undefined;
    isFree?: boolean | undefined;
    isPublished?: boolean | undefined;
    durationMinutes?: number | undefined;
    isPreview?: boolean | undefined;
    videoUrl?: string | undefined;
    videoProvider?: string | undefined;
    videoPlaybackId?: string | undefined;
    embedCode?: string | undefined;
    xpReward?: number | undefined;
}, {
    type?: "VIDEO" | "ARTICLE" | "QUIZ" | "ASSIGNMENT" | "LIVE_SESSION" | "SCORM" | "CODE_EXERCISE" | "INTERACTIVE" | "DOCUMENT" | "AUDIO" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    content?: string | undefined;
    sortOrder?: number | undefined;
    isFree?: boolean | undefined;
    isPublished?: boolean | undefined;
    durationMinutes?: number | undefined;
    isPreview?: boolean | undefined;
    videoUrl?: string | undefined;
    videoProvider?: string | undefined;
    videoPlaybackId?: string | undefined;
    embedCode?: string | undefined;
    xpReward?: number | undefined;
}>;
export declare const EnrollCourseSchema: z.ZodObject<{
    courseId: z.ZodString;
    couponCode: z.ZodOptional<z.ZodString>;
    cohortId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    courseId: string;
    couponCode?: string | undefined;
    cohortId?: string | undefined;
}, {
    courseId: string;
    couponCode?: string | undefined;
    cohortId?: string | undefined;
}>;
export declare const UpdateLessonProgressSchema: z.ZodObject<{
    lessonId: z.ZodString;
    watchedSeconds: z.ZodOptional<z.ZodNumber>;
    totalSeconds: z.ZodOptional<z.ZodNumber>;
    lastPosition: z.ZodOptional<z.ZodNumber>;
    isCompleted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    lessonId: string;
    isCompleted?: boolean | undefined;
    watchedSeconds?: number | undefined;
    totalSeconds?: number | undefined;
    lastPosition?: number | undefined;
}, {
    lessonId: string;
    isCompleted?: boolean | undefined;
    watchedSeconds?: number | undefined;
    totalSeconds?: number | undefined;
    lastPosition?: number | undefined;
}>;
export declare const SubmitQuizSchema: z.ZodObject<{
    quizId: z.ZodString;
    enrollmentId: z.ZodOptional<z.ZodString>;
    answers: z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        selectedOptionIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        textAnswer: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        selectedOptionIds: string[];
        textAnswer?: string | undefined;
    }, {
        questionId: string;
        selectedOptionIds?: string[] | undefined;
        textAnswer?: string | undefined;
    }>, "many">;
    timeSpent: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    quizId: string;
    answers: {
        questionId: string;
        selectedOptionIds: string[];
        textAnswer?: string | undefined;
    }[];
    timeSpent: number;
    enrollmentId?: string | undefined;
}, {
    quizId: string;
    answers: {
        questionId: string;
        selectedOptionIds?: string[] | undefined;
        textAnswer?: string | undefined;
    }[];
    enrollmentId?: string | undefined;
    timeSpent?: number | undefined;
}>;
export declare const CreateQuizSchema: z.ZodObject<{
    lessonId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["GRADED", "PRACTICE", "SURVEY", "ASSESSMENT"]>>;
    timeLimit: z.ZodOptional<z.ZodNumber>;
    passingScore: z.ZodDefault<z.ZodNumber>;
    maxAttempts: z.ZodOptional<z.ZodNumber>;
    shuffleQuestions: z.ZodDefault<z.ZodBoolean>;
    shuffleOptions: z.ZodDefault<z.ZodBoolean>;
    showResults: z.ZodDefault<z.ZodBoolean>;
    showCorrectAnswers: z.ZodDefault<z.ZodBoolean>;
    showExplanations: z.ZodDefault<z.ZodBoolean>;
    xpReward: z.ZodDefault<z.ZodNumber>;
    questions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["MULTIPLE_CHOICE", "SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "LONG_ANSWER", "CODE", "RATING"]>;
        question: z.ZodString;
        explanation: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
        points: z.ZodDefault<z.ZodNumber>;
        sortOrder: z.ZodDefault<z.ZodNumber>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            isCorrect: z.ZodDefault<z.ZodBoolean>;
            explanation: z.ZodOptional<z.ZodString>;
            sortOrder: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            sortOrder: number;
            isCorrect: boolean;
            explanation?: string | undefined;
        }, {
            text: string;
            sortOrder?: number | undefined;
            explanation?: string | undefined;
            isCorrect?: boolean | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER" | "CODE" | "RATING";
        sortOrder: number;
        question: string;
        points: number;
        options?: {
            text: string;
            sortOrder: number;
            isCorrect: boolean;
            explanation?: string | undefined;
        }[] | undefined;
        explanation?: string | undefined;
        imageUrl?: string | undefined;
    }, {
        type: "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER" | "CODE" | "RATING";
        question: string;
        options?: {
            text: string;
            sortOrder?: number | undefined;
            explanation?: string | undefined;
            isCorrect?: boolean | undefined;
        }[] | undefined;
        sortOrder?: number | undefined;
        explanation?: string | undefined;
        imageUrl?: string | undefined;
        points?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "GRADED" | "PRACTICE" | "SURVEY" | "ASSESSMENT";
    title: string;
    xpReward: number;
    lessonId: string;
    passingScore: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResults: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    questions: {
        type: "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER" | "CODE" | "RATING";
        sortOrder: number;
        question: string;
        points: number;
        options?: {
            text: string;
            sortOrder: number;
            isCorrect: boolean;
            explanation?: string | undefined;
        }[] | undefined;
        explanation?: string | undefined;
        imageUrl?: string | undefined;
    }[];
    description?: string | undefined;
    maxAttempts?: number | undefined;
    timeLimit?: number | undefined;
}, {
    title: string;
    lessonId: string;
    type?: "GRADED" | "PRACTICE" | "SURVEY" | "ASSESSMENT" | undefined;
    description?: string | undefined;
    maxAttempts?: number | undefined;
    xpReward?: number | undefined;
    timeLimit?: number | undefined;
    passingScore?: number | undefined;
    shuffleQuestions?: boolean | undefined;
    shuffleOptions?: boolean | undefined;
    showResults?: boolean | undefined;
    showCorrectAnswers?: boolean | undefined;
    showExplanations?: boolean | undefined;
    questions?: {
        type: "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER" | "CODE" | "RATING";
        question: string;
        options?: {
            text: string;
            sortOrder?: number | undefined;
            explanation?: string | undefined;
            isCorrect?: boolean | undefined;
        }[] | undefined;
        sortOrder?: number | undefined;
        explanation?: string | undefined;
        imageUrl?: string | undefined;
        points?: number | undefined;
    }[] | undefined;
}>;
export declare const CourseReviewSchema: z.ZodObject<{
    rating: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    title?: string | undefined;
    content?: string | undefined;
}, {
    rating: number;
    title?: string | undefined;
    content?: string | undefined;
}>;
export declare const CreateLearningPathSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    level: z.ZodDefault<z.ZodEnum<["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    courseIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
    title: string;
    tags: string[];
    courseIds: string[];
    description?: string | undefined;
    slug?: string | undefined;
}, {
    title: string;
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    slug?: string | undefined;
    courseIds?: string[] | undefined;
}>;
export declare const AssignmentSubmissionSchema: z.ZodObject<{
    assignmentId: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    fileUrls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    assignmentId: string;
    fileUrls: string[];
    content?: string | undefined;
}, {
    assignmentId: string;
    content?: string | undefined;
    fileUrls?: string[] | undefined;
}>;
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
//# sourceMappingURL=course.schema.d.ts.map