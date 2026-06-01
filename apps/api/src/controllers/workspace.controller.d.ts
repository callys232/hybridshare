import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
export declare class WorkspaceController {
    create(req: AuthRequest, res: Response): Promise<void>;
    list(req: AuthRequest, res: Response): Promise<void>;
    get(req: AuthRequest, res: Response): Promise<void>;
    update(req: AuthRequest, res: Response): Promise<void>;
    remove(req: AuthRequest, res: Response): Promise<void>;
    inviteMember(req: AuthRequest, res: Response): Promise<void>;
    updateMember(req: AuthRequest, res: Response): Promise<void>;
    removeMember(req: AuthRequest, res: Response): Promise<void>;
    getActivity(req: AuthRequest, res: Response): Promise<void>;
    getFiles(req: AuthRequest, res: Response): Promise<void>;
}
export declare const workspaceController: WorkspaceController;
//# sourceMappingURL=workspace.controller.d.ts.map