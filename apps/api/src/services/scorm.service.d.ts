export declare const scormService: {
    createPackage(data: {
        courseId: string;
        lessonId?: string;
        title: string;
        version: "1.2" | "2004";
        storageKey: string;
        launchUrl: string;
        uploadedById: string;
    }): Promise<any>;
    getPackage(packageId: string): Promise<any>;
    listPackages(courseId: string): Promise<any>;
    getOrCreateSession(packageId: string, userId: string): Promise<any>;
    /**
     * Called by the SCORM API shim in the frontend when it calls:
     * LMSSetValue / SetValue
     */
    updateSession(sessionId: string, userId: string, updates: {
        completionStatus?: string;
        successStatus?: string;
        score?: number;
        totalTime?: string;
        suspendData?: string;
        location?: string;
        data?: Record<string, unknown>;
    }): Promise<any>;
    storeXAPIStatement(statement: {
        id: string;
        actor: Record<string, unknown>;
        verb: {
            id: string;
            display: Record<string, string>;
        };
        object: Record<string, unknown>;
        result?: Record<string, unknown>;
        context?: Record<string, unknown>;
        timestamp?: string;
        userId?: string;
        courseId?: string;
    }): Promise<any>;
    getXAPIStatements(params: {
        userId?: string;
        courseId?: string;
        verb?: string;
        limit?: number;
    }): Promise<any>;
};
//# sourceMappingURL=scorm.service.d.ts.map