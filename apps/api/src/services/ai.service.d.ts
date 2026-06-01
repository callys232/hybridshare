export declare class AIService {
    private readonly MODEL;
    generateQuiz(input: {
        topic: string;
        content?: string;
        questionCount?: number;
        difficulty?: 'easy' | 'medium' | 'hard';
        types?: string[];
        courseId?: string;
        createdById: string;
    }): Promise<unknown>;
    generateCourseOutline(input: {
        title: string;
        description?: string;
        level: string;
        targetAudience?: string;
        durationHours?: number;
        createdById: string;
    }): Promise<any>;
    generateSummary(content: string, createdById: string): Promise<string>;
    generateCourseDescription(input: {
        title: string;
        topics: string[];
        level: string;
        createdById: string;
    }): Promise<any>;
    generateRecommendations(userId: string): Promise<any>;
    chatAssistant(messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>, context?: string): Promise<any>;
    analyzeContent(content: string, createdById: string): Promise<any>;
    private estimateCost;
}
export declare const aiService: AIService;
//# sourceMappingURL=ai.service.d.ts.map