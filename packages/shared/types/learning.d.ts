export type CourseStatus = 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type LessonType = 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT' | 'LIVE_SESSION' | 'SCORM' | 'CODE_EXERCISE' | 'INTERACTIVE' | 'DOCUMENT' | 'AUDIO';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'REFUNDED' | 'PAUSED' | 'EXPIRED';
export type QuizType = 'GRADED' | 'PRACTICE' | 'SURVEY' | 'ASSESSMENT';
export type QuestionType = 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'MATCHING' | 'FILL_BLANK' | 'CODE' | 'FILE_UPLOAD' | 'RATING';
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RESUBMIT' | 'LATE' | 'ACCEPTED';
export type CertificateStatus = 'ISSUED' | 'REVOKED' | 'EXPIRED';
export type LearningPathStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LiveSessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'RECORDING_AVAILABLE';
export interface CourseCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    parentId?: string;
    sortOrder: number;
    isActive: boolean;
    children?: CourseCategory[];
}
export interface Course {
    id: string;
    title: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    level: CourseLevel;
    status: CourseStatus;
    language: string;
    durationMinutes: number;
    totalLessons: number;
    price: number;
    discountPrice?: number;
    currency: string;
    isFree: boolean;
    isPublic: boolean;
    requiresApproval: boolean;
    certificateEnabled: boolean;
    rating: number;
    totalRatings: number;
    totalStudents: number;
    totalReviews: number;
    totalRevenue: number;
    outcomes: string[];
    requirements: string[];
    tags: string[];
    categoryId?: string;
    category?: CourseCategory;
    instructorId?: string;
    instructor?: InstructorProfile;
    organizationId?: string;
    createdById: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    modules?: CourseModule[];
    isEnrolled?: boolean;
    myProgress?: EnrollmentProgress;
}
export interface InstructorProfile {
    id: string;
    userId: string;
    headline?: string;
    bio?: string;
    expertise: string[];
    rating: number;
    totalRatings: number;
    totalStudents: number;
    totalReviews: number;
    isVerified: boolean;
    user?: {
        id: string;
        name: string;
        avatar?: string;
        email: string;
    };
}
export interface CourseModule {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    sortOrder: number;
    isPublished: boolean;
    durationMinutes: number;
    lessons: Lesson[];
    createdAt: string;
    updatedAt: string;
}
export interface Lesson {
    id: string;
    moduleId: string;
    title: string;
    description?: string;
    type: LessonType;
    sortOrder: number;
    durationMinutes: number;
    isPublished: boolean;
    isFree: boolean;
    isPreview: boolean;
    videoUrl?: string;
    videoProvider?: string;
    videoPlaybackId?: string;
    thumbnailUrl?: string;
    content?: string;
    embedCode?: string;
    notesUrl?: string;
    transcriptUrl?: string;
    xpReward: number;
    attachments?: LessonAttachment[];
    quiz?: Quiz;
    assignment?: Assignment;
    progress?: LessonProgressData;
    createdAt: string;
    updatedAt: string;
}
export interface LessonAttachment {
    id: string;
    lessonId: string;
    name: string;
    url: string;
    type: string;
    size?: number;
    sortOrder: number;
}
export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    status: EnrollmentStatus;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    lastAccessedAt?: string;
    completedAt?: string;
    expiresAt?: string;
    xpEarned: number;
    timeSpentMinutes: number;
    course?: Course;
    createdAt: string;
    updatedAt: string;
}
export interface EnrollmentProgress {
    enrollmentId: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    timeSpentMinutes: number;
    lastAccessedAt?: string;
    completedAt?: string;
    lessonProgress: Record<string, LessonProgressData>;
}
export interface LessonProgressData {
    lessonId: string;
    isCompleted: boolean;
    completedAt?: string;
    watchedSeconds: number;
    totalSeconds: number;
    watchPercentage: number;
    lastPosition: number;
}
export interface Quiz {
    id: string;
    lessonId: string;
    title: string;
    description?: string;
    type: QuizType;
    timeLimit?: number;
    passingScore: number;
    maxAttempts?: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResults: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    xpReward: number;
    questions?: QuizQuestion[];
    myAttempts?: QuizAttempt[];
}
export interface QuizQuestion {
    id: string;
    quizId: string;
    type: QuestionType;
    question: string;
    explanation?: string;
    imageUrl?: string;
    points: number;
    sortOrder: number;
    options?: QuizOption[];
}
export interface QuizOption {
    id: string;
    questionId: string;
    text: string;
    isCorrect?: boolean;
    explanation?: string;
    sortOrder: number;
}
export interface QuizAttempt {
    id: string;
    quizId: string;
    userId: string;
    enrollmentId?: string;
    attempt: number;
    score: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
    timeSpent: number;
    startedAt: string;
    submittedAt?: string;
    answers?: QuizAttemptAnswer[];
}
export interface QuizAttemptAnswer {
    id: string;
    questionId: string;
    selectedOptionIds: string[];
    textAnswer?: string;
    isCorrect?: boolean;
    points: number;
}
export interface Assignment {
    id: string;
    lessonId: string;
    title: string;
    description: string;
    instructions?: string;
    maxScore: number;
    passingScore: number;
    dueInDays?: number;
    allowLate: boolean;
    maxFileSize: number;
    allowedTypes: string[];
    xpReward: number;
    rubric: RubricItem[];
    mySubmission?: AssignmentSubmission;
}
export interface RubricItem {
    criterion: string;
    weight: number;
    description: string;
    levels: {
        label: string;
        points: number;
        description: string;
    }[];
}
export interface AssignmentSubmission {
    id: string;
    assignmentId: string;
    userId: string;
    content?: string;
    fileUrls: string[];
    status: SubmissionStatus;
    score?: number;
    feedback?: string;
    isLate: boolean;
    submittedAt: string;
}
export interface UserCertificate {
    id: string;
    userId: string;
    enrollmentId: string;
    credentialId: string;
    title: string;
    status: CertificateStatus;
    pdfUrl?: string;
    imageUrl?: string;
    issuedAt: string;
    expiresAt?: string;
    course?: Course;
    instructor?: InstructorProfile;
}
export interface LearningPath {
    id: string;
    title: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    status: LearningPathStatus;
    estimatedHours: number;
    level: CourseLevel;
    tags: string[];
    courses?: LearningPathCourse[];
    myEnrollment?: LearningPathEnrollment;
    createdAt: string;
    updatedAt: string;
}
export interface LearningPathCourse {
    id: string;
    learningPathId: string;
    courseId: string;
    sortOrder: number;
    isRequired: boolean;
    course?: Course;
}
export interface LearningPathEnrollment {
    id: string;
    userId: string;
    learningPathId: string;
    progress: number;
    completedAt?: string;
    createdAt: string;
}
export interface LiveSession {
    id: string;
    lessonId?: string;
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes: number;
    timezone: string;
    status: LiveSessionStatus;
    meetingUrl?: string;
    platform?: string;
    maxAttendees?: number;
    isRecorded: boolean;
    recordingUrl?: string;
    hostId: string;
    attendeeCount?: number;
    isRegistered?: boolean;
}
export interface CourseReview {
    id: string;
    courseId: string;
    userId: string;
    rating: number;
    title?: string;
    content?: string;
    isPublished: boolean;
    helpfulCount: number;
    user?: {
        id: string;
        name: string;
        avatar?: string;
    };
    createdAt: string;
    updatedAt: string;
}
export interface ForumThread {
    id: string;
    forumId: string;
    authorId: string;
    title: string;
    isPinned: boolean;
    isLocked: boolean;
    viewCount: number;
    replyCount: number;
    lastActivityAt: string;
    author?: {
        id: string;
        name: string;
        avatar?: string;
    };
    latestPost?: ForumPost;
    createdAt: string;
}
export interface ForumPost {
    id: string;
    threadId: string;
    authorId: string;
    parentId?: string;
    content: string;
    isAnswer: boolean;
    upvotes: number;
    author?: {
        id: string;
        name: string;
        avatar?: string;
        role?: string;
    };
    replies?: ForumPost[];
    hasLiked?: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface LearningAnalytics {
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    avgProgress: number;
    avgTimeSpentMinutes: number;
    totalCertificatesIssued: number;
    totalXpAwarded: number;
    engagementScore: number;
    weeklyActiveUsers: number;
    topCourses: Array<{
        courseId: string;
        title: string;
        enrollments: number;
        completionRate: number;
    }>;
    progressOverTime: Array<{
        date: string;
        enrollments: number;
        completions: number;
    }>;
    levelDistribution: Record<CourseLevel, number>;
    categoryDistribution: Array<{
        category: string;
        count: number;
    }>;
}
export interface SCORMData {
    packageId: string;
    userId: string;
    completionStatus: string;
    successStatus: string;
    score?: number;
    totalTime: string;
    suspendData?: string;
    location?: string;
    data: Record<string, unknown>;
}
//# sourceMappingURL=learning.d.ts.map