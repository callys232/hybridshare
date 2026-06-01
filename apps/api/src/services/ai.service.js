"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const client = new sdk_1.default({ apiKey: env_1.env.ANTHROPIC_API_KEY });
class AIService {
    MODEL = 'claude-sonnet-4-6';
    // ─── Quiz Generation ───────────────────────────────────────────────────────
    async generateQuiz(input) {
        const questionCount = input.questionCount ?? 5;
        const difficulty = input.difficulty ?? 'medium';
        const types = input.types?.join(', ') ?? 'multiple choice, true/false';
        const prompt = `You are an expert educator creating quiz questions for an online course.

Topic: ${input.topic}
Difficulty: ${difficulty}
Number of questions: ${questionCount}
Question types: ${types}
${input.content ? `\nContent to base questions on:\n${input.content}` : ''}

Create ${questionCount} quiz questions. Return as JSON with this structure:
{
  "title": "Quiz title",
  "description": "Brief quiz description",
  "questions": [
    {
      "type": "SINGLE_CHOICE|MULTIPLE_CHOICE|TRUE_FALSE",
      "question": "The question text",
      "explanation": "Explanation of the correct answer",
      "points": 1,
      "options": [
        { "text": "Option A", "isCorrect": false },
        { "text": "Option B", "isCorrect": true },
        { "text": "Option C", "isCorrect": false },
        { "text": "Option D", "isCorrect": false }
      ]
    }
  ]
}

Only return valid JSON, no markdown code blocks.`;
        const response = await client.messages.create({
            model: this.MODEL,
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        let result;
        try {
            result = JSON.parse(text);
        }
        catch {
            throw new Error('Failed to parse AI quiz response');
        }
        await database_1.prisma.aIGeneratedContent.create({
            data: {
                type: 'quiz',
                prompt,
                result: result,
                model: this.MODEL,
                tokens: response.usage.input_tokens + response.usage.output_tokens,
                cost: this.estimateCost(response.usage.input_tokens, response.usage.output_tokens),
                resourceId: input.courseId,
                resourceType: 'course',
                createdById: input.createdById,
            },
        });
        return result;
    }
    // ─── Course Outline Generation ────────────────────────────────────────────
    async generateCourseOutline(input) {
        const prompt = `You are an expert instructional designer creating a comprehensive course outline.

Course Title: ${input.title}
Level: ${input.level}
${input.description ? `Description: ${input.description}` : ''}
${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ''}
${input.durationHours ? `Estimated Duration: ${input.durationHours} hours` : ''}

Create a detailed course outline with modules and lessons. Return as JSON:
{
  "title": "Course title",
  "shortDescription": "2-3 sentence description",
  "outcomes": ["What students will learn (5-7 items)"],
  "requirements": ["Prerequisites (3-5 items)"],
  "modules": [
    {
      "title": "Module title",
      "description": "Module description",
      "lessons": [
        {
          "title": "Lesson title",
          "type": "VIDEO|ARTICLE|QUIZ|ASSIGNMENT",
          "durationMinutes": 15,
          "description": "What this lesson covers"
        }
      ]
    }
  ]
}

Only return valid JSON.`;
        const response = await client.messages.create({
            model: this.MODEL,
            max_tokens: 6000,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const result = JSON.parse(text);
        await database_1.prisma.aIGeneratedContent.create({
            data: {
                type: 'outline',
                prompt,
                result,
                model: this.MODEL,
                tokens: response.usage.input_tokens + response.usage.output_tokens,
                cost: this.estimateCost(response.usage.input_tokens, response.usage.output_tokens),
                createdById: input.createdById,
            },
        });
        return result;
    }
    // ─── Content Summary ──────────────────────────────────────────────────────
    async generateSummary(content, createdById) {
        const response = await client.messages.create({
            model: this.MODEL,
            max_tokens: 1000,
            messages: [{
                    role: 'user',
                    content: `Summarize the following educational content in 3-5 bullet points, highlighting the key concepts and takeaways:\n\n${content}`,
                }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        await database_1.prisma.aIGeneratedContent.create({
            data: {
                type: 'summary',
                prompt: content.slice(0, 500),
                result: { summary: text },
                model: this.MODEL,
                tokens: response.usage.input_tokens + response.usage.output_tokens,
                cost: this.estimateCost(response.usage.input_tokens, response.usage.output_tokens),
                createdById,
            },
        });
        return text;
    }
    // ─── Course Description ───────────────────────────────────────────────────
    async generateCourseDescription(input) {
        const response = await client.messages.create({
            model: this.MODEL,
            max_tokens: 1500,
            messages: [{
                    role: 'user',
                    content: `Write a compelling course description for:
Title: ${input.title}
Level: ${input.level}
Topics covered: ${input.topics.join(', ')}

Write a full description (200-300 words) that:
1. Hooks learners in the first sentence
2. Explains what they'll learn
3. Shows the value/outcomes
4. Mentions who it's for

Also write a short description (1-2 sentences) for preview cards.

Return as JSON: { "description": "...", "shortDescription": "..." }`,
                }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        return JSON.parse(text);
    }
    // ─── Smart Recommendations ────────────────────────────────────────────────
    async generateRecommendations(userId) {
        // Get user's learning history
        const [completedCourses, enrolledCourses, userBadges, userProfile] = await Promise.all([
            database_1.prisma.enrollment.findMany({
                where: { userId, status: 'COMPLETED' },
                include: { course: { select: { categoryId: true, level: true, tags: true } } },
                take: 10,
            }),
            database_1.prisma.enrollment.findMany({
                where: { userId, status: 'ACTIVE' },
                include: { course: { select: { categoryId: true, tags: true } } },
                take: 5,
            }),
            database_1.prisma.userBadge.findMany({ where: { userId }, take: 5, include: { badge: true } }),
            database_1.prisma.user.findUnique({ where: { id: userId }, select: { jobTitle: true, bio: true, xpPoints: true } }),
        ]);
        // Get available courses not yet enrolled
        const enrolledIds = [...completedCourses, ...enrolledCourses].map((e) => e.courseId);
        const candidates = await database_1.prisma.course.findMany({
            where: { status: 'PUBLISHED', id: { notIn: enrolledIds } },
            orderBy: { totalStudents: 'desc' },
            take: 20,
            select: { id: true, title: true, level: true, categoryId: true, tags: true, rating: true },
        });
        // Simple collaborative + content-based scoring
        const completedTags = new Set(completedCourses.flatMap((e) => e.course.tags));
        const completedCategories = new Set(completedCourses.map((e) => e.course.categoryId).filter(Boolean));
        const scored = candidates.map((course) => {
            let score = course.rating * 10;
            if (completedCategories.has(course.categoryId))
                score += 30;
            const tagMatches = course.tags.filter((t) => completedTags.has(t)).length;
            score += tagMatches * 15;
            return { courseId: course.id, score, reasons: [] };
        });
        scored.sort((a, b) => b.score - a.score);
        const top10 = scored.slice(0, 10);
        // Upsert recommendations
        if (top10.length > 0) {
            await database_1.prisma.$transaction(top10.map((r) => database_1.prisma.aIRecommendation.upsert({
                where: { userId_courseId: { userId, courseId: r.courseId } },
                create: { userId, courseId: r.courseId, score: r.score, reasons: r.reasons },
                update: { score: r.score },
            })));
        }
        return database_1.prisma.aIRecommendation.findMany({
            where: { userId, wasEnrolled: false },
            orderBy: { score: 'desc' },
            take: 6,
            include: {
                course: {
                    include: {
                        instructor: { include: { user: { select: { name: true, avatar: true } } } },
                        category: true,
                    },
                },
            },
        });
    }
    // ─── Chat Assistant ───────────────────────────────────────────────────────
    async chatAssistant(messages, context) {
        const systemPrompt = `You are a helpful learning assistant for HybridShare LMS. You help students understand course material, answer questions, and guide their learning journey.
${context ? `\nContext: ${context}` : ''}
Be concise, encouraging, and educational. Use markdown formatting for code and lists.`;
        const response = await client.messages.create({
            model: this.MODEL,
            max_tokens: 2000,
            system: systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
        return response.content[0].type === 'text' ? response.content[0].text : '';
    }
    // ─── Content Analysis ─────────────────────────────────────────────────────
    async analyzeContent(content, createdById) {
        const response = await client.messages.create({
            model: this.MODEL,
            max_tokens: 1500,
            messages: [{
                    role: 'user',
                    content: `Analyze the following educational content and provide:
1. Readability score (1-10)
2. Key concepts covered (list)
3. Suggested tags
4. Level recommendation (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT)
5. Estimated reading time in minutes
6. Improvement suggestions (3-5 items)

Content: ${content.slice(0, 4000)}

Return as JSON: {
  "readabilityScore": 8,
  "keyConcepts": [],
  "suggestedTags": [],
  "level": "INTERMEDIATE",
  "readingTimeMinutes": 10,
  "improvements": []
}`,
                }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        return JSON.parse(text);
    }
    estimateCost(inputTokens, outputTokens) {
        // Claude Sonnet pricing: ~$3/M input, ~$15/M output
        return (inputTokens * 0.000003) + (outputTokens * 0.000015);
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=ai.service.js.map