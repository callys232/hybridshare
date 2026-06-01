"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = formatBytes;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.formatRelativeTime = formatRelativeTime;
exports.truncate = truncate;
exports.slugify = slugify;
exports.getFileExtension = getFileExtension;
exports.getMimeTypeIcon = getMimeTypeIcon;
exports.generateToken = generateToken;
exports.buildApiResponse = buildApiResponse;
exports.buildPaginationMeta = buildPaginationMeta;
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
function formatDate(date, options) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', options ?? { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function formatRelativeTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (seconds < 60)
        return 'just now';
    if (minutes < 60)
        return `${minutes}m ago`;
    if (hours < 24)
        return `${hours}h ago`;
    if (days < 7)
        return `${days}d ago`;
    return formatDate(d);
}
function truncate(str, length) {
    if (str.length <= length)
        return str;
    return `${str.substring(0, length)}...`;
}
function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '';
}
function getMimeTypeIcon(mimeType) {
    if (mimeType.startsWith('image/'))
        return 'image';
    if (mimeType.startsWith('video/'))
        return 'video';
    if (mimeType.startsWith('audio/'))
        return 'audio';
    if (mimeType === 'application/pdf')
        return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
        return 'spreadsheet';
    if (mimeType.includes('document') || mimeType.includes('word'))
        return 'document';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
        return 'presentation';
    if (mimeType.startsWith('text/'))
        return 'text';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip'))
        return 'archive';
    return 'file';
}
function generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function buildApiResponse(data, error = null, meta) {
    return {
        success: error === null,
        data,
        error,
        ...(meta ? { meta } : {}),
    };
}
function buildPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
//# sourceMappingURL=format.js.map