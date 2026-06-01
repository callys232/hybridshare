import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
export declare class FileController {
    upload(req: AuthRequest, res: Response): Promise<void>;
    getFile(req: AuthRequest, res: Response): Promise<void>;
    download(req: AuthRequest, res: Response): Promise<void>;
    preview(req: AuthRequest, res: Response): Promise<void>;
    updateFile(req: AuthRequest, res: Response): Promise<void>;
    deleteFile(req: AuthRequest, res: Response): Promise<void>;
    restoreFile(req: AuthRequest, res: Response): Promise<void>;
    permanentDelete(req: AuthRequest, res: Response): Promise<void>;
    listFiles(req: AuthRequest, res: Response): Promise<void>;
    toggleStar(req: AuthRequest, res: Response): Promise<void>;
    bulkOperation(req: AuthRequest, res: Response): Promise<void>;
    recycleBin(req: AuthRequest, res: Response): Promise<void>;
    listVersions(req: AuthRequest, res: Response): Promise<void>;
    uploadVersion(req: AuthRequest, res: Response): Promise<void>;
    restoreVersion(req: AuthRequest, res: Response): Promise<void>;
}
export declare const fileController: FileController;
//# sourceMappingURL=file.controller.d.ts.map