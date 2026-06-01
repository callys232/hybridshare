import type { Request, Response, NextFunction } from 'express';
export declare const courseController: {
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getBySlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCategories: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMyCourses: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getInstructorCourses: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    publish: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    archive: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    stats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    enroll: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    createReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    markReviewHelpful: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createModule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateModule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteModule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    reorderModules: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createLesson: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateLesson: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteLesson: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    reorderLessons: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
//# sourceMappingURL=course.controller.d.ts.map