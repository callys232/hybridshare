import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/crypto";
import { isBlacklisted } from "../config/redis";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";

export interface AuthRequest extends Request {
  user?: Express.User;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      data: null,
      error: "Authorization token required",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      res
        .status(401)
        .json({ success: false, data: null, error: "Token has been revoked" });
      return;
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        data: null,
        error: "User not found or deactivated",
      });
      return;
    }

    (req as AuthRequest).user = { ...payload, id: user.id };
    next();
  } catch (error) {
    logger.debug("Auth middleware token verification failed", { error });
    res
      .status(401)
      .json({ success: false, data: null, error: "Invalid or expired token" });
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const blacklisted = await isBlacklisted(token);
    if (!blacklisted) {
      const payload = verifyAccessToken(token);
      (req as AuthRequest).user = { ...payload, id: payload.sub };
    }
  } catch {
    // Token invalid — treat as unauthenticated
  }

  next();
}
