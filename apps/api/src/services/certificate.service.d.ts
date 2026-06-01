export declare const certificateService: {
    /**
     * Issue a certificate after course completion.
     * Called by enrollment.service after handleCourseCompletion.
     */
    issueCertificate(enrollmentId: string): Promise<{
        id: string;
        credentialId: string;
        title: string;
        pdfUrl?: string;
    }>;
    getCertificate(certId: string, userId: string): Promise<any>;
    getUserCertificates(userId: string): Promise<any>;
    /** Public credential verification (no auth required) */
    verifyCertificate(credentialId: string): Promise<{
        valid: boolean;
        credentialId: any;
        recipientName: any;
        courseTitle: any;
        courseLevel: any;
        instructorName: any;
        issuedAt: any;
        expiresAt: any;
    }>;
    revokeCertificate(certId: string, adminId: string, reason: string): Promise<any>;
    /** Attach S3/Minio PDF URL after generation */
    setPdfUrl(certId: string, pdfUrl: string): Promise<any>;
};
//# sourceMappingURL=certificate.service.d.ts.map