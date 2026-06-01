import type { PaginationQuery } from '../utils/paginate';
import type { CreateCourseInput, UpdateCourseInput, CreateModuleInput, CreateLessonInput, CourseReviewInput } from '@hybridshare/shared/schemas/course.schema';
export declare class CourseService {
    createCourse(userId: string, input: CreateCourseInput): Promise<any>;
    private _createCourse;
    getCourse(courseId: string, userId?: string): Promise<any>;
    getCourseBySlug(slug: string, userId?: string): Promise<any>;
    updateCourse(courseId: string, userId: string, input: UpdateCourseInput): Promise<any>;
    publishCourse(courseId: string, userId: string): Promise<any>;
    archiveCourse(courseId: string, userId: string): Promise<any>;
    deleteCourse(courseId: string, userId: string): Promise<void>;
    listCourses(query: PaginationQuery & {
        status?: string;
        level?: string;
        categoryId?: string;
        instructorId?: string;
        organizationId?: string;
        search?: string;
        isFree?: boolean;
        sortBy?: string;
        tags?: string;
    }, userId?: string): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
    getMyCourses(userId: string, query: PaginationQuery & {
        status?: string;
    }): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
    getInstructorCourses(userId: string, query: PaginationQuery): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
    createModule(courseId: string, userId: string, input: CreateModuleInput): Promise<any>;
    updateModule(moduleId: string, userId: string, input: Partial<CreateModuleInput> & {
        isPublished?: boolean;
    }): Promise<any>;
    deleteModule(moduleId: string, userId: string): Promise<void>;
    reorderModules(courseId: string, userId: string, order: {
        id: string;
        sortOrder: number;
    }[]): Promise<void>;
    createLesson(userId: string, input: CreateLessonInput): Promise<any>;
    updateLesson(lessonId: string, userId: string, input: Partial<CreateLessonInput> & {
        isPublished?: boolean;
    }): Promise<any>;
    deleteLesson(lessonId: string, userId: string): Promise<void>;
    reorderLessons(moduleId: string, userId: string, order: {
        id: string;
        sortOrder: number;
    }[]): Promise<void>;
    createReview(courseId: string, userId: string, input: CourseReviewInput): Promise<any>;
    getReviews(courseId: string, query: PaginationQuery & {
        rating?: number;
    }): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
    getCategories(): Promise<any>;
    getCourseStats(courseId: string, userId: string): Promise<{
        totalEnrollments: any;
        activeEnrollments: any;
        completions: any;
        completionRate: number;
        totalRevenue: number;
        avgRating: any;
        totalReviews: any;
        avgCompletionTime: any;
    }>;
    private assertCourseOwner;
    private recalcCourseDuration;
    private recalcRating;
}
export declare const courseService: CourseService;
//# sourceMappingURL=course.service.d.ts.map