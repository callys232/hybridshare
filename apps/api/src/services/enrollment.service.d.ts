import type { UpdateLessonProgressInput, SubmitQuizInput, AssignmentSubmissionInput } from '@hybridshare/shared/schemas/course.schema';
export declare class EnrollmentService {
    enrollFree(userId: string, courseId: string, cohortId?: string): Promise<any>;
    enrollAfterPayment(userId: string, courseId: string, paymentId: string): Promise<any>;
    private createEnrollment;
    updateLessonProgress(userId: string, input: UpdateLessonProgressInput): Promise<any>;
    private recalcEnrollmentProgress;
    private handleCourseCompletion;
    submitQuiz(userId: string, input: SubmitQuizInput): Promise<{
        attempt: any;
        isPassed: boolean;
        score: number;
        maxScore: number;
        percentage: number;
        passingScore: any;
        xpEarned: any;
    }>;
    submitAssignment(userId: string, input: AssignmentSubmissionInput): Promise<any>;
    getEnrollmentDetails(userId: string, courseId: string): Promise<any>;
    getNextLesson(userId: string, courseId: string): Promise<any>;
}
export declare const enrollmentService: EnrollmentService;
//# sourceMappingURL=enrollment.service.d.ts.map