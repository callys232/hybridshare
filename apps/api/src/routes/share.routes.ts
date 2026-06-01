import { Router } from 'express';
import { shareController } from '../controllers/share.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, (req, res) => shareController.create(req, res));
router.get('/', authMiddleware, (req, res) => shareController.list(req, res));
router.get('/:token', optionalAuthMiddleware, (req, res) => shareController.resolve(req, res));
router.get('/:token/files', optionalAuthMiddleware, (req, res) => shareController.listFiles(req, res));
router.post('/:token/verify', (req, res) => shareController.verifyPassword(req, res));
router.delete('/:id', authMiddleware, (req, res) => shareController.revoke(req, res));
router.get('/:id/analytics', authMiddleware, (req, res) => shareController.getAnalytics(req, res));

export { router as shareRouter };
