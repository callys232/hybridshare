import { Router } from 'express';
import { workspaceController } from '../controllers/workspace.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWorkspaceAdmin, requireWorkspaceMembership } from '../middleware/rbac.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/', (req, res) => workspaceController.create(req, res));
router.get('/', (req, res) => workspaceController.list(req, res));
router.get('/:id', requireWorkspaceMembership(), (req, res) => workspaceController.get(req, res));
router.put('/:id', requireWorkspaceAdmin(), (req, res) => workspaceController.update(req, res));
router.delete('/:id', requireWorkspaceAdmin(), (req, res) => workspaceController.remove(req, res));

router.post('/:id/members', requireWorkspaceAdmin(), (req, res) => workspaceController.inviteMember(req, res));
router.put('/:id/members/:userId', requireWorkspaceAdmin(), (req, res) => workspaceController.updateMember(req, res));
router.delete('/:id/members/:userId', requireWorkspaceAdmin(), (req, res) => workspaceController.removeMember(req, res));

router.get('/:id/activity', requireWorkspaceMembership(), (req, res) => workspaceController.getActivity(req, res));
router.get('/:id/files', requireWorkspaceMembership(), (req, res) => workspaceController.getFiles(req, res));

export { router as workspaceRouter };
