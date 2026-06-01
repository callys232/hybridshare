"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const MAX_SIZE_BYTES = env_1.env.MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff',
    '.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv',
    '.mp3', '.wav', '.ogg', '.flac', '.aac',
    '.pdf',
    '.doc', '.docx', '.odt',
    '.xls', '.xlsx', '.ods', '.csv',
    '.ppt', '.pptx', '.odp',
    '.txt', '.md', '.rtf', '.html', '.xml', '.json', '.yaml', '.yml',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.js', '.ts', '.jsx', '.tsx', '.css', '.scss',
    '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.sh',
]);
const storage = multer_1.default.memoryStorage();
function fileFilter(req, file, cb) {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (mime === 'application/x-msdownload' || ext === '.exe' || ext === '.bat' || ext === '.cmd') {
        cb(new Error('Executable files are not allowed'));
        return;
    }
    if (env_1.env.ALLOWED_MIME_TYPES !== '*') {
        const allowed = env_1.env.ALLOWED_MIME_TYPES.split(',').map((t) => t.trim());
        const isAllowed = allowed.some((pattern) => {
            if (pattern.endsWith('/*')) {
                return mime.startsWith(pattern.slice(0, -1));
            }
            return mime === pattern;
        });
        if (!isAllowed) {
            cb(new Error(`File type '${mime}' is not allowed`));
            return;
        }
    }
    if (!ALLOWED_EXTENSIONS.has(ext) && ext !== '') {
        cb(new Error(`File extension '${ext}' is not allowed`));
        return;
    }
    cb(null, true);
}
exports.uploadSingle = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter,
}).single('file');
exports.uploadMultiple = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_SIZE_BYTES, files: 20 },
    fileFilter,
}).array('files', 20);
exports.uploadAvatar = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files allowed for avatar'));
            return;
        }
        cb(null, true);
    },
}).single('avatar');
//# sourceMappingURL=upload.middleware.js.map