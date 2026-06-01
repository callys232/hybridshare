import { Router } from "express";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth.middleware";
import { credentialService } from "../services/credential.service";
import { storageService } from "../services/storage.service";
import { createConnector } from "../connectors/connector.registry";
import {
  apiResponse,
  apiError,
  parsePagination,
  buildMeta,
} from "../utils/paginate";
import type { AuthRequest } from "../middleware/auth.middleware";
import type { ConnectorType } from "@hybridshare/shared/types/connector";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const { connectorId, type, q } = req.query as Record<string, string>;
    const { skip, take, page, limit } = parsePagination({ page: 1, limit: 50 });

    const where = {
      ...(connectorId ? { connectorId } : {}),
      ...(type ? { type } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.uDCAsset.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.uDCAsset.count({ where }),
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
});

router.get("/:id", async (req, res) => {
  try {
    const asset = await prisma.uDCAsset.findUnique({
      where: { id: req.params.id },
    });
    if (!asset) {
      res.status(404).json(apiError("Asset not found"));
      return;
    }
    res.status(200).json(apiResponse(asset));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get("/:id/preview", async (req, res) => {
  try {
    const asset = await prisma.uDCAsset.findUnique({
      where: { id: req.params.id },
    });
    if (!asset) {
      res.status(404).json(apiError("Asset not found"));
      return;
    }
    if (asset.url) {
      res.status(200).json(apiResponse({ url: asset.url }));
      return;
    }
    res.status(404).json(apiError("No preview available"));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get("/:id/download", async (req, res) => {
  try {
    const asset = await prisma.uDCAsset.findUnique({
      where: { id: req.params.id },
    });
    if (!asset) {
      res.status(404).json(apiError("Asset not found"));
      return;
    }
    const connector = await prisma.connector.findUnique({
      where: { id: asset.connectorId },
    });
    if (!connector) {
      res.status(404).json(apiError("Connector not found"));
      return;
    }
    const instance = createConnector(connector.type as ConnectorType);
    const credentials = await credentialService.retrieve(asset.connectorId);
    await instance.connect(credentials);
    const content = await instance.fetchContent(asset.externalId);
    await instance.disconnect();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asset.name}"`,
    );
    res.setHeader("Content-Type", asset.mimeType ?? "application/octet-stream");
    res.send(content);
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post("/:id/import", async (req, res) => {
  try {
    const asset = await prisma.uDCAsset.findUnique({
      where: { id: req.params.id },
    });
    if (!asset) {
      res.status(404).json(apiError("Asset not found"));
      return;
    }

    const connector = await prisma.connector.findUnique({
      where: { id: asset.connectorId },
    });
    if (!connector) {
      res.status(404).json(apiError("Connector not found"));
      return;
    }

    const instance = createConnector(connector.type as ConnectorType);
    const credentials = await credentialService.retrieve(asset.connectorId);
    await instance.connect(credentials);
    const content = await instance.fetchContent(asset.externalId);
    await instance.disconnect();

    const uploadResult = await storageService.uploadFile(
      content,
      asset.name,
      asset.mimeType ?? "application/octet-stream",
      req.user!.id,
    );

    const file = await prisma.file.create({
      data: {
        name: asset.name,
        originalName: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
        size: BigInt(content.length),
        extension: storageService.getFileExtension(asset.name),
        storagePath: uploadResult.storagePath,
        thumbnailPath: uploadResult.thumbnailPath,
        checksum: uploadResult.checksum,
        uploadedById: req.user!.id,
        description: `Imported from connector: ${connector.name}`,
      },
    });

    await prisma.uDCAsset.update({
      where: { id: req.params.id },
      data: { isImported: true, importedFileId: file.id },
    });

    res.status(201).json(apiResponse({ file, asset }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post("/:id/snapshot", async (req, res) => {
  try {
    const asset = await prisma.uDCAsset.findUnique({
      where: { id: req.params.id },
    });
    if (!asset) {
      res.status(404).json(apiError("Asset not found"));
      return;
    }

    await prisma.uDCAudit.create({
      data: {
        assetId: req.params.id,
        connectorId: asset.connectorId,
        action: "snapshot",
        userId: req.user!.id,
        metadata: { timestamp: new Date().toISOString() },
      },
    });

    res.status(200).json(apiResponse({ message: "Snapshot recorded" }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post("/:id/tag", async (req, res) => {
  try {
    const { tags } = req.body as { tags: string[] };
    const asset = await prisma.uDCAsset.update({
      where: { id: req.params.id },
      data: { tags },
    });
    res.status(200).json(apiResponse(asset));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

export { router as assetRouter };
