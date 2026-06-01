import { Router } from "express";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadAvatar } from "../middleware/upload.middleware";
import { storageService } from "../services/storage.service";
import { hashPassword, verifyPassword } from "../utils/crypto";
import { apiResponse, apiError } from "../utils/paginate";
import type { AuthRequest } from "../middleware/auth.middleware";
import { z } from "zod";

const router = Router();
router.use(authMiddleware);

const ME_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  provider: true,
  isEmailVerified: true,
  isTwoFactorEnabled: true,
  isActive: true,
  lastLoginAt: true,
  storageUsed: true,
  storageQuota: true,
  bio: true,
  jobTitle: true,
  website: true,
  linkedinUrl: true,
  twitterHandle: true,
  timezone: true,
  language: true,
  xpPoints: true,
  streakDays: true,
  longestStreak: true,
  createdAt: true,
  updatedAt: true,
} as const;

router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: ME_SELECT,
    });
    if (!user) {
      res.status(404).json(apiError("User not found"));
      return;
    }
    res.status(200).json(
      apiResponse({
        ...user,
        storageUsed: Number(user.storageUsed),
        storageQuota: Number(user.storageQuota),
      }),
    );
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  jobTitle: z.string().max(100).optional(),
  website: z.string().url().max(200).optional().or(z.literal("")),
  linkedinUrl: z.string().max(200).optional(),
  twitterHandle: z.string().max(50).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
});

router.put("/me", async (req, res) => {
  try {
    const data = UpdateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: ME_SELECT,
    });
    res.status(200).json(
      apiResponse({
        ...user,
        storageUsed: Number(user.storageUsed),
        storageQuota: Number(user.storageQuota),
      }),
    );
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.post("/me/avatar", uploadAvatar, async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json(apiError("No image provided"));
      return;
    }
    const avatarUrl = await storageService.uploadAvatar(
      req.file.buffer,
      req.user!.id,
    );
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
    });
    res.status(200).json(apiResponse({ avatar: user.avatar }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.put("/me/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(128),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.password) {
      res
        .status(400)
        .json(apiError("Password change not available for OAuth accounts"));
      return;
    }

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      res.status(401).json(apiError("Current password is incorrect"));
      return;
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: await hashPassword(newPassword) },
    });

    res
      .status(200)
      .json(apiResponse({ message: "Password updated successfully" }));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

export { router as userRouter };
