import { Router } from "express";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/rbac.middleware";
import { auditService } from "../services/audit.service";
import { analyticsService } from "../services/analytics.service";
import { hashPassword } from "../utils/crypto";
import {
  apiResponse,
  apiError,
  parsePagination,
  buildMeta,
} from "../utils/paginate";
import type { AuthRequest } from "../middleware/auth.middleware";
import { z } from "zod";

const router = Router();
router.use(authMiddleware, requireAdmin());

const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z
    .enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER", "GUEST"])
    .default("MEMBER"),
});

const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER", "GUEST"]).optional(),
  isActive: z.boolean().optional(),
  storageQuota: z.number().optional(),
});

// Users
router.get("/users", async (req, res) => {
  try {
    const { page, limit, search } = req.query as Record<string, string>;
    const { skip, take, ...pageMeta } = parsePagination({
      page: parseInt(page ?? "1"),
      limit: parseInt(limit ?? "20"),
    });

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          storageUsed: true,
          storageQuota: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      error: null,
      meta: buildMeta(total, pageMeta.page, pageMeta.limit),
    });
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post("/users", async (req, res) => {
  try {
    const input = CreateUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      res.status(409).json(apiError("Email already exists"));
      return;
    }
    const user = await prisma.user.create({
      data: {
        ...input,
        password: await hashPassword(input.password),
        isEmailVerified: true,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    res.status(201).json(apiResponse(user));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const input = UpdateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...input,
        ...(input.storageQuota
          ? { storageQuota: BigInt(input.storageQuota) }
          : {}),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.status(200).json(apiResponse(user));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.status(200).json(apiResponse({ message: "User deactivated" }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

// Audit
router.get("/audit", async (req: AuthRequest, res) => {
  try {
    const query = req.query as Record<string, string>;
    const result = await auditService.list({
      page: parseInt(query.page ?? "1"),
      limit: parseInt(query.limit ?? "50"),
      userId: query.userId,
      action: query.action,
      resourceType: query.resourceType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    res.status(200).json({
      success: true,
      data: result.items,
      error: null,
      meta: result.meta,
    });
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get("/audit/export", async (req: AuthRequest, res) => {
  try {
    const query = req.query as Record<string, string>;
    const csv = await auditService.exportCsv(query);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-log-${Date.now()}.csv"`,
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

// Storage
router.get("/storage", async (req: AuthRequest, res) => {
  try {
    const data = await analyticsService.getStorageBreakdown();
    res.status(200).json(apiResponse(data));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

// Settings
router.put("/settings", async (req: AuthRequest, res) => {
  try {
    const settings = req.body as Record<string, unknown>;
    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(value) as never },
        update: { value: JSON.stringify(value) as never },
      }),
    );
    await Promise.all(updates);
    res.status(200).json(apiResponse({ message: "Settings updated" }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

// Disable connector
router.post("/connectors/:id/disable", async (req: AuthRequest, res) => {
  try {
    await prisma.connector.update({
      where: { id: req.params.id },
      data: { isEnabled: false },
    });
    res.status(200).json(apiResponse({ message: "Connector disabled" }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

export { router as adminRouter };
