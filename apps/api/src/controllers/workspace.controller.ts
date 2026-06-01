import type { Response, Request } from "express";
import { prisma } from "../config/database";
import {
  apiResponse,
  apiError,
  parsePagination,
  buildMeta,
} from "../utils/paginate";
import type { AuthRequest } from "../middleware/auth.middleware";
import { WorkspaceRole } from "@hybridshare/shared/types/workspace";
import { z } from "zod";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["PERSONAL", "TEAM", "PROJECT", "DEPARTMENT"]).default("TEAM"),
  isPublic: z.boolean().default(false),
  color: z.string().default("#c12129"),
  storageQuota: z.number().optional(),
});

const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();

const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.VIEWER),
});

export class WorkspaceController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const input = CreateWorkspaceSchema.parse(req.body);

      const workspace = await prisma.workspace.create({
        data: {
          ...input,
          ownerId: (req as import("../middleware/auth.middleware").AuthRequest)
            .user!.id,
          storageQuota: BigInt(input.storageQuota ?? 107374182400),
          members: {
            create: {
              userId: (
                req as import("../middleware/auth.middleware").AuthRequest
              ).user!.id,
              role: WorkspaceRole.OWNER,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          _count: { select: { files: true, members: true } },
        },
      });

      res
        .status(201)
        .json(
          apiResponse({
            ...workspace,
            storageUsed: Number(workspace.storageUsed),
            storageQuota: Number(workspace.storageQuota),
          }),
        );
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const workspaces = await prisma.workspace.findMany({
        where: {
          OR: [
            {
              ownerId: (
                req as import("../middleware/auth.middleware").AuthRequest
              ).user!.id,
            },
            {
              members: {
                some: {
                  userId: (
                    req as import("../middleware/auth.middleware").AuthRequest
                  ).user!.id,
                },
              },
            },
          ],
        },
        include: {
          members: {
            take: 5,
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          _count: { select: { files: true, members: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      const result = workspaces.map((w) => ({
        ...w,
        storageUsed: Number(w.storageUsed),
        storageQuota: Number(w.storageQuota),
      }));

      res.status(200).json(apiResponse(result));
    } catch (err) {
      res.status(500).json(apiError((err as Error).message));
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.params.id },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          _count: { select: { files: true, folders: true, members: true } },
        },
      });

      if (!workspace) {
        res.status(404).json(apiError("Workspace not found"));
        return;
      }

      res.status(200).json(
        apiResponse({
          ...workspace,
          storageUsed: Number(workspace.storageUsed),
          storageQuota: Number(workspace.storageQuota),
        }),
      );
    } catch (err) {
      res.status(500).json(apiError((err as Error).message));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const input = UpdateWorkspaceSchema.parse(req.body);
      const workspace = await prisma.workspace.update({
        where: { id: req.params.id },
        data: {
          ...input,
          ...(input.storageQuota
            ? { storageQuota: BigInt(input.storageQuota) }
            : {}),
        },
      });
      res
        .status(200)
        .json(
          apiResponse({
            ...workspace,
            storageUsed: Number(workspace.storageUsed),
            storageQuota: Number(workspace.storageQuota),
          }),
        );
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      await prisma.workspace.delete({ where: { id: req.params.id } });
      res.status(200).json(apiResponse({ message: "Workspace deleted" }));
    } catch (err) {
      res.status(500).json(apiError((err as Error).message));
    }
  }

  async inviteMember(req: Request, res: Response): Promise<void> {
    try {
      const { email, role } = InviteMemberSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(404).json(apiError("User not found"));
        return;
      }

      const existing = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: req.params.id, userId: user.id },
        },
      });

      if (existing) {
        res.status(409).json(apiError("User is already a member"));
        return;
      }

      const member = await prisma.workspaceMember.create({
        data: {
          workspaceId: req.params.id,
          userId: user.id,
          role,
          invitedById: (
            req as import("../middleware/auth.middleware").AuthRequest
          ).user!.id,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });

      res.status(201).json(apiResponse(member));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async updateMember(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.body as { role: WorkspaceRole };
      const member = await prisma.workspaceMember.updateMany({
        where: { workspaceId: req.params.id, userId: req.params.userId },
        data: { role },
      });
      res.status(200).json(apiResponse(member));
    } catch (err) {
      res.status(500).json(apiError((err as Error).message));
    }
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      await prisma.workspaceMember.deleteMany({
        where: { workspaceId: req.params.id, userId: req.params.userId },
      });
      res.status(200).json(apiResponse({ message: "Member removed" }));
    } catch (err) {
      res.status(500).json(apiError((err as Error).message));
    }
  }

  async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query as Record<string, string>;
      const { skip, take, page, limit } = parsePagination({
        page: parseInt(query.page ?? "1"),
        limit: parseInt(query.limit ?? "20"),
      });

      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { metadata: { path: ["workspaceId"], equals: req.params.id } },
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        }),
        prisma.auditLog.count({
          where: { metadata: { path: ["workspaceId"], equals: req.params.id } },
        }),
      ]);

      res
        .status(200)
        .json({
          success: true,
          data: items,
          error: null,
          meta: buildMeta(total, page, limit),
        });
    } catch (err) {
      res.status(500).json(apiError((err as Error).message));
    }
  }

  async getFiles(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query as Record<string, string>;
      const { skip, take, page, limit } = parsePagination({
        page: parseInt(query.page ?? "1"),
        limit: parseInt(query.limit ?? "20"),
      });

      const [items, total] = await Promise.all([
        prisma.file.findMany({
          where: { workspaceId: req.params.id, status: "ACTIVE" },
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: { select: { id: true, name: true, avatar: true } },
            tags: true,
          },
        }),
        prisma.file.count({
          where: { workspaceId: req.params.id, status: "ACTIVE" },
        }),
      ]);

      res
        .status(200)
        .json({
          success: true,
          data: items,
          error: null,
          meta: buildMeta(total, page, limit),
        });
    } catch (err) {
      res.status(500).json(apiError((err as Error).message));
    }
  }
}

export const workspaceController = new WorkspaceController();
