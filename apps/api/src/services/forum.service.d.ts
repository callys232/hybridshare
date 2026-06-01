export declare const forumService: {
    listThreads(forumId: string, params?: {
        page?: number;
        limit?: number;
        sort?: "latest" | "popular" | "unanswered";
        search?: string;
        isPinned?: boolean;
    }): Promise<{
        items: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getThread(threadId: string, userId?: string): Promise<any>;
    createThread(data: {
        forumId: string;
        authorId: string;
        title: string;
        content: string;
        tags?: string[];
        courseId?: string;
    }): Promise<any>;
    createPost(threadId: string, authorId: string, data: {
        content: string;
        parentId?: string;
    }): Promise<any>;
    editPost(postId: string, userId: string, content: string): Promise<any>;
    deletePost(postId: string, userId: string, isAdmin?: boolean): Promise<void>;
    toggleLike(postId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    markAnswer(postId: string, threadAuthorId: string, userId: string): Promise<any>;
    pinThread(threadId: string, adminId: string): Promise<any>;
    lockThread(threadId: string, adminId: string): Promise<any>;
    getDefaultForum(): Promise<any>;
    ensureDefaultForum(courseId?: string): Promise<any>;
};
//# sourceMappingURL=forum.service.d.ts.map