"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinioClient = getMinioClient;
exports.initializeMinio = initializeMinio;
exports.checkMinioHealth = checkMinioHealth;
exports.generatePresignedUrl = generatePresignedUrl;
exports.generateUploadPresignedUrl = generateUploadPresignedUrl;
exports.uploadBuffer = uploadBuffer;
exports.deleteObject = deleteObject;
exports.deleteObjects = deleteObjects;
exports.getObjectBuffer = getObjectBuffer;
exports.objectExists = objectExists;
exports.buildObjectPath = buildObjectPath;
const Minio = __importStar(require("minio"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let minioClient = null;
function getMinioClient() {
    if (!minioClient) {
        minioClient = new Minio.Client({
            endPoint: env_1.env.MINIO_ENDPOINT,
            port: env_1.env.MINIO_PORT,
            useSSL: env_1.env.MINIO_USE_SSL,
            accessKey: env_1.env.MINIO_ACCESS_KEY,
            secretKey: env_1.env.MINIO_SECRET_KEY,
            region: env_1.env.MINIO_REGION,
        });
    }
    return minioClient;
}
async function initializeMinio() {
    const client = getMinioClient();
    const bucket = env_1.env.MINIO_BUCKET;
    try {
        const exists = await client.bucketExists(bucket);
        if (!exists) {
            await client.makeBucket(bucket, env_1.env.MINIO_REGION);
            logger_1.logger.info(`MinIO bucket '${bucket}' created`);
            const policy = JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Deny',
                        Principal: '*',
                        Action: 's3:GetObject',
                        Resource: `arn:aws:s3:::${bucket}/*`,
                    },
                ],
            });
            await client.setBucketPolicy(bucket, policy);
            logger_1.logger.info(`MinIO bucket '${bucket}' policy set to private`);
        }
        else {
            logger_1.logger.info(`MinIO bucket '${bucket}' already exists`);
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize MinIO', { error });
        throw error;
    }
}
async function checkMinioHealth() {
    try {
        await getMinioClient().listBuckets();
        return true;
    }
    catch {
        return false;
    }
}
async function generatePresignedUrl(objectPath, expirySeconds = 3600, bucket = env_1.env.MINIO_BUCKET) {
    return getMinioClient().presignedGetObject(bucket, objectPath, expirySeconds);
}
async function generateUploadPresignedUrl(objectPath, expirySeconds = 3600, bucket = env_1.env.MINIO_BUCKET) {
    return getMinioClient().presignedPutObject(bucket, objectPath, expirySeconds);
}
async function uploadBuffer(objectPath, buffer, mimeType, metadata = {}, bucket = env_1.env.MINIO_BUCKET) {
    await getMinioClient().putObject(bucket, objectPath, buffer, buffer.length, {
        'Content-Type': mimeType,
        ...metadata,
    });
}
async function deleteObject(objectPath, bucket = env_1.env.MINIO_BUCKET) {
    await getMinioClient().removeObject(bucket, objectPath);
}
async function deleteObjects(objectPaths, bucket = env_1.env.MINIO_BUCKET) {
    const objectsList = objectPaths.map((name) => ({ name }));
    await new Promise((resolve, reject) => {
        const stream = getMinioClient().removeObjects(bucket, objectsList);
        stream.on('error', reject);
        stream.on('finish', resolve);
    });
}
async function getObjectBuffer(objectPath, bucket = env_1.env.MINIO_BUCKET) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        getMinioClient().getObject(bucket, objectPath, (err, dataStream) => {
            if (err)
                return reject(err);
            dataStream.on('data', (chunk) => chunks.push(chunk));
            dataStream.on('end', () => resolve(Buffer.concat(chunks)));
            dataStream.on('error', reject);
        });
    });
}
async function objectExists(objectPath, bucket = env_1.env.MINIO_BUCKET) {
    try {
        await getMinioClient().statObject(bucket, objectPath);
        return true;
    }
    catch {
        return false;
    }
}
function buildObjectPath(userId, filename, prefix = 'files') {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${prefix}/${year}/${month}/${userId}/${Date.now()}_${filename}`;
}
//# sourceMappingURL=minio.js.map