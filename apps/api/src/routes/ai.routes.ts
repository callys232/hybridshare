import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';
import type { Request, Response, NextFunction } from 'express';

export const aiRouter = Router();
aiRouter.use(authenticate);
const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

aiRouter.get('/recommendations', async (req, res, next) => {
  try { ok(res, await aiService.generateRecommendations(uid(req))); } catch (e) { next(e); }
});

aiRouter.post('/generate/quiz', async (req, res, next) => {
  try { ok(res, await aiService.generateQuiz({ ...req.body, createdById: uid(req) })); } catch (e) { next(e); }
});

aiRouter.post('/generate/outline', async (req, res, next) => {
  try { ok(res, await aiService.generateCourseOutline({ ...req.body, createdById: uid(req) })); } catch (e) { next(e); }
});

aiRouter.post('/generate/description', async (req, res, next) => {
  try { ok(res, await aiService.generateCourseDescription({ ...req.body, createdById: uid(req) })); } catch (e) { next(e); }
});

aiRouter.post('/generate/summary', async (req, res, next) => {
  try { ok(res, { summary: await aiService.generateSummary(req.body.content, uid(req)) }); } catch (e) { next(e); }
});

aiRouter.post('/analyze/content', async (req, res, next) => {
  try { ok(res, await aiService.analyzeContent(req.body.content, uid(req))); } catch (e) { next(e); }
});

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const { messages, context } = req.body;
    ok(res, { response: await aiService.chatAssistant(messages, context) });
  } catch (e) { next(e); }
});
