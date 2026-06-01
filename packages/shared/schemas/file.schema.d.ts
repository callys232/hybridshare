import { z } from 'zod';
export declare const CreateFolderSchema: z.ZodObject<{
    name: z.ZodString;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workspaceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    workspaceId?: string | null | undefined;
    parentId?: string | null | undefined;
}, {
    name: string;
    workspaceId?: string | null | undefined;
    parentId?: string | null | undefined;
}>;
export declare const RenameFolderSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const MoveFolderSchema: z.ZodObject<{
    parentId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    parentId: string | null;
}, {
    parentId: string | null;
}>;
export declare const UpdateFileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    folderId?: string | null | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    folderId?: string | null | undefined;
}>;
export declare const BulkOperationSchema: z.ZodObject<{
    fileIds: z.ZodArray<z.ZodString, "many">;
    operation: z.ZodEnum<["move", "copy", "delete", "tag", "star"]>;
    targetFolderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    fileIds: string[];
    operation: "copy" | "move" | "delete" | "tag" | "star";
    targetFolderId?: string | null | undefined;
    tagIds?: string[] | undefined;
}, {
    fileIds: string[];
    operation: "copy" | "move" | "delete" | "tag" | "star";
    targetFolderId?: string | null | undefined;
    tagIds?: string[] | undefined;
}>;
export declare const CreateShareLinkSchema: z.ZodObject<{
    fileId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workspaceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodEnum<["VIEW", "DOWNLOAD", "COMMENT", "EDIT"]>, "many">>;
    password: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    maxViews: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    permissions: ("VIEW" | "DOWNLOAD" | "COMMENT" | "EDIT")[];
    password?: string | undefined;
    workspaceId?: string | null | undefined;
    folderId?: string | null | undefined;
    fileId?: string | null | undefined;
    expiresAt?: string | null | undefined;
    maxViews?: number | null | undefined;
}, {
    password?: string | undefined;
    workspaceId?: string | null | undefined;
    folderId?: string | null | undefined;
    fileId?: string | null | undefined;
    permissions?: ("VIEW" | "DOWNLOAD" | "COMMENT" | "EDIT")[] | undefined;
    expiresAt?: string | null | undefined;
    maxViews?: number | null | undefined;
}>;
export declare const VerifySharePasswordSchema: z.ZodObject<{
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
}, {
    password: string;
}>;
export declare const UploadVersionSchema: z.ZodObject<{
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    comment?: string | undefined;
}, {
    comment?: string | undefined;
}>;
export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;
export type UpdateFileInput = z.infer<typeof UpdateFileSchema>;
export type BulkOperationInput = z.infer<typeof BulkOperationSchema>;
export type CreateShareLinkInput = z.infer<typeof CreateShareLinkSchema>;
export type VerifySharePasswordInput = z.infer<typeof VerifySharePasswordSchema>;
//# sourceMappingURL=file.schema.d.ts.map