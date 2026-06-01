"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.buildMeta = buildMeta;
exports.buildOrderBy = buildOrderBy;
exports.apiResponse = apiResponse;
exports.apiError = apiError;
function parsePagination(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    return { skip, take: limit, page, limit };
}
function buildMeta(total, page, limit) {
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
function buildOrderBy(sortBy, sortOrder, allowedFields, defaultField = 'createdAt') {
    const field = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: order };
}
function apiResponse(data, meta) {
    return { success: true, data, error: null, ...(meta ? { meta } : {}) };
}
function apiError(error, statusCode = 500) {
    return { success: false, data: null, error, statusCode };
}
//# sourceMappingURL=paginate.js.map