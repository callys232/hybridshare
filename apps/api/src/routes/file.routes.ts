import { Router } from 'express';
import { fileController } from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { virusScanMiddleware } from '../middleware/virusScan.middleware';
import { uploadRateLimit } from '../middleware/rateLimit.middleware';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => fileController.listFiles(req, res));
router.get('/recycle-bin', (req, res) => fileController.recycleBin(req, res));
router.get('/starred', (req, res) => fileController.listFiles(req, res));

router.post(
  '/upload',
  uploadRateLimit,
  uploadSingle,
  virusScanMiddleware,
  auditLog({ action: 'file.upload', resourceType: 'file', getResourceId: (req) => req.file?.originalname ?? 'unknown' }),
  (req, res) => fileController.upload(req, res)
);

router.post(
  '/bulk',
  auditLog({ action: 'file.bulk', resourceType: 'file' }),
  (req, res) => fileController.bulkOperation(req, res)
);

router.get('/:id', (req, res) => fileController.getFile(req, res));
router.get('/:id/download', (req, res) => fileController.download(req, res));
router.get('/:id/preview', (req, res) => fileController.preview(req, res));
router.put('/:id', auditLog({ action: 'file.update', resourceType: 'file' }), (req, res) => fileController.updateFile(req, res));
router.delete('/:id', auditLog({ action: 'file.delete', resourceType: 'file' }), (req, res) => fileController.deleteFile(req, res));
router.post('/:id/restore', (req, res) => fileController.restoreFile(req, res));
router.delete('/:id/permanent', auditLog({ action: 'file.permanent_delete', resourceType: 'file' }), (req, res) => fileController.permanentDelete(req, res));
router.post('/:id/star', (req, res) => fileController.toggleStar(req, res));

router.get('/:id/versions', (req, res) => fileController.listVersions(req, res));
router.post('/:id/version', uploadRateLimit, uploadSingle, virusScanMiddleware, (req, res) => fileController.uploadVersion(req, res));
router.get('/:id/versions/:versionId/restore', (req, res) => fileController.restoreVersion(req, res));

export { router as fileRouter };
