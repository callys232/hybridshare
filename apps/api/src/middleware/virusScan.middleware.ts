import type { Response, NextFunction } from 'express';
import NodeClam from 'clamscan';
import { Readable } from 'stream';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { AuthRequest } from './auth.middleware';

let clamScanner: NodeClam | null = null;
let scannerInitFailed = false;

async function getClamScanner(): Promise<NodeClam | null> {
  if (scannerInitFailed) return null;
  if (clamScanner) return clamScanner;

  try {
    const scanner = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      fileList: null,
      scanRecursively: false,
      clamdscan: {
        socket: env.CLAMAV_SOCKET || false,
        host: env.CLAMAV_HOST,
        port: env.CLAMAV_PORT,
        timeout: 60000,
        localFallback: true,
        active: true,
      },
      preference: 'clamdscan',
    });

    clamScanner = scanner;
    logger.info('ClamAV scanner initialized');
    return scanner;
  } catch (error) {
    logger.warn('ClamAV unavailable — virus scanning disabled', { error });
    scannerInitFailed = true;
    return null;
  }
}

export async function virusScanMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const file = req.file;
  const files = req.files as Express.Multer.File[] | undefined;

  const filesToScan: Express.Multer.File[] = [];
  if (file) filesToScan.push(file);
  if (files?.length) filesToScan.push(...files);

  if (filesToScan.length === 0) {
    next();
    return;
  }

  const scanner = await getClamScanner();

  if (!scanner) {
    logger.warn('Skipping virus scan — ClamAV not available');
    next();
    return;
  }

  try {
    for (const uploadedFile of filesToScan) {
      const stream = Readable.from(uploadedFile.buffer);
      const { isInfected, viruses } = await scanner.scanStream(stream);

      if (isInfected) {
        logger.warn('Virus detected in uploaded file', {
          filename: uploadedFile.originalname,
          viruses,
        });
        res.status(422).json({
          success: false,
          data: null,
          error: `File '${uploadedFile.originalname}' contains malware: ${viruses?.join(', ')}`,
        });
        return;
      }
    }

    next();
  } catch (error) {
    logger.error('Virus scan error', { error });
    next();
  }
}
