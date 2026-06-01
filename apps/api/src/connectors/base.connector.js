"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConnector = void 0;
const logger_1 = require("../utils/logger");
class BaseConnector {
    credentials = {};
    isConnected = false;
    changeHandlers = [];
    async subscribeToChanges(handler) {
        this.changeHandlers.push(handler);
        logger_1.logger.debug('Change handler registered', { connectorId: this.id });
    }
    async emitChange(change) {
        for (const handler of this.changeHandlers) {
            try {
                await handler(change);
            }
            catch (err) {
                logger_1.logger.error('Change handler error', { connectorId: this.id, err });
            }
        }
    }
    normalizeDate(dateValue) {
        if (!dateValue)
            return null;
        if (dateValue instanceof Date)
            return dateValue;
        if (typeof dateValue === 'string' || typeof dateValue === 'number') {
            const d = new Date(dateValue);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    }
    buildNormalizedAsset(partial) {
        return {
            connectorId: this.id,
            externalId: partial.id,
            type: partial.type ?? 'file',
            mimeType: partial.mimeType ?? null,
            size: partial.size ?? null,
            url: partial.url ?? null,
            thumbnailUrl: partial.thumbnailUrl ?? null,
            metadata: partial.metadata ?? {},
            tags: partial.tags ?? [],
            createdAt: partial.createdAt ?? null,
            updatedAt: partial.updatedAt ?? null,
            fetchedAt: new Date(),
            ...partial,
        };
    }
    async withRetry(operation, maxRetries = 3, delayMs = 1000) {
        let lastError = new Error('Operation failed');
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                logger_1.logger.warn(`Connector operation attempt ${attempt} failed`, {
                    connectorId: this.id,
                    error: lastError.message,
                });
                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
                }
            }
        }
        throw lastError;
    }
}
exports.BaseConnector = BaseConnector;
//# sourceMappingURL=base.connector.js.map