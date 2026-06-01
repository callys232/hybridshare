"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.virusScanMiddleware = virusScanMiddleware;
const clamscan_1 = __importDefault(require("clamscan"));
const stream_1 = require("stream");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
let clamScanner = null;
let scannerInitFailed = false;
async function getClamScanner() {
    if (scannerInitFailed)
        return null;
    if (clamScanner)
        return clamScanner;
    try {
        const scanner = await new clamscan_1.default().init({
            removeInfected: false,
            quarantineInfected: false,
            scanLog: null,
            debugMode: false,
            fileList: null,
            scanRecursively: false,
            clamdscan: {
                socket: env_1.env.CLAMAV_SOCKET || false,
                host: env_1.env.CLAMAV_HOST,
                port: env_1.env.CLAMAV_PORT,
                timeout: 60000,
                localFallback: true,
                active: true,
            },
            preference: 'clamdscan',
        });
        clamScanner = scanner;
        logger_1.logger.info('ClamAV scanner initialized');
        return scanner;
    }
    catch (error) {
        logger_1.logger.warn('ClamAV unavailable — virus scanning disabled', { error });
        scannerInitFailed = true;
        return null;
    }
}
async function virusScanMiddleware(req, res, next) {
    const file = req.file;
    const files = req.files;
    const filesToScan = [];
    if (file)
        filesToScan.push(file);
    if (files?.length)
        filesToScan.push(...files);
    if (filesToScan.length === 0) {
        next();
        return;
    }
    const scanner = await getClamScanner();
    if (!scanner) {
        logger_1.logger.warn('Skipping virus scan — ClamAV not available');
        next();
        return;
    }
    try {
        for (const uploadedFile of filesToScan) {
            const stream = stream_1.Readable.from(uploadedFile.buffer);
            const { isInfected, viruses } = await scanner.scanStream(stream);
            if (isInfected) {
                logger_1.logger.warn('Virus detected in uploaded file', {
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
    }
    catch (error) {
        logger_1.logger.error('Virus scan error', { error });
        next();
    }
}
//# sourceMappingURL=virusScan.middleware.js.map