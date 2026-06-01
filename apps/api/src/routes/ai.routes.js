"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const ai_service_1 = require("../services/ai.service");
exports.aiRouter = (0, express_1.Router)();
exports.aiRouter.use(auth_middleware_1.authenticate);
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
exports.aiRouter.get('/recommendations', async (req, res, next) => {
    try {
        ok(res, await ai_service_1.aiService.generateRecommendations(uid(req)));
    }
    catch (e) {
        next(e);
    }
});
exports.aiRouter.post('/generate/quiz', async (req, res, next) => {
    try {
        ok(res, await ai_service_1.aiService.generateQuiz({ ...req.body, createdById: uid(req) }));
    }
    catch (e) {
        next(e);
    }
});
exports.aiRouter.post('/generate/outline', async (req, res, next) => {
    try {
        ok(res, await ai_service_1.aiService.generateCourseOutline({ ...req.body, createdById: uid(req) }));
    }
    catch (e) {
        next(e);
    }
});
exports.aiRouter.post('/generate/description', async (req, res, next) => {
    try {
        ok(res, await ai_service_1.aiService.generateCourseDescription({ ...req.body, createdById: uid(req) }));
    }
    catch (e) {
        next(e);
    }
});
exports.aiRouter.post('/generate/summary', async (req, res, next) => {
    try {
        ok(res, { summary: await ai_service_1.aiService.generateSummary(req.body.content, uid(req)) });
    }
    catch (e) {
        next(e);
    }
});
exports.aiRouter.post('/analyze/content', async (req, res, next) => {
    try {
        ok(res, await ai_service_1.aiService.analyzeContent(req.body.content, uid(req)));
    }
    catch (e) {
        next(e);
    }
});
exports.aiRouter.post('/chat', async (req, res, next) => {
    try {
        const { messages, context } = req.body;
        ok(res, { response: await ai_service_1.aiService.chatAssistant(messages, context) });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=ai.routes.js.map