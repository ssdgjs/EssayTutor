import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendSuccess, asyncHandler } from '../middleware/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createEssaySchema = z.object({
  rubricId: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  source: z.enum(['text', 'photo']).default('text'),
  photoUrl: z.string().url().optional()
});

// GET /api/essays - List essays with pagination
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const sortBy = req.query.sortBy as string || 'createdAt';
  const order = req.query.order as string || 'desc';

  const where: any = { userId };
  if (status) {
    where.status = status;
  }

  const [essays, total] = await Promise.all([
    prisma.essay.findMany({
      where,
      include: {
        rubric: {
          select: {
            id: true,
            name: true
          }
        },
        result: {
          select: {
            overallScore: true,
            maxScore: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: order }
    }),
    prisma.essay.count({ where })
  ]);

  return sendSuccess(res, {
    data: essays,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// POST /api/essays - Create essay
router.post('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const result = createEssaySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0].message
      }
    });
  }

  const { rubricId, title, content, source, photoUrl } = result.data;

  // Verify rubric exists and belongs to user
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId }
  });

  if (!rubric) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RUBRIC_NOT_FOUND',
        message: 'Rubric not found'
      }
    });
  }

  if (rubric.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to use this rubric'
      }
    });
  }

  // Create essay
  const essay = await prisma.essay.create({
    data: {
      userId,
      rubricId,
      title: title || 'Untitled Essay',
      content,
      source,
      photoUrl,
      status: 'pending'
    },
    include: {
      rubric: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // TODO: Trigger grading job in background

  return sendSuccess(res, essay, 201);
}));

// GET /api/essays/:id - Get essay details
router.get('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const essay = await prisma.essay.findUnique({
    where: { id },
    include: {
      rubric: {
        select: {
          id: true,
          name: true,
          dimensions: true
        }
      },
      result: true
    }
  });

  if (!essay) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Essay not found'
      }
    });
  }

  if (essay.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }

  return sendSuccess(res, essay);
}));

// DELETE /api/essays/:id - Delete essay
router.delete('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const essay = await prisma.essay.findUnique({
    where: { id }
  });

  if (!essay) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Essay not found'
      }
    });
  }

  if (essay.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }

  await prisma.essay.delete({ where: { id } });

  return res.status(204).send();
}));

// GET /api/essays/:id/result - Get grading result
router.get('/:id/result', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const essay = await prisma.essay.findUnique({
    where: { id },
    include: { result: true }
  });

  if (!essay) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Essay not found'
      }
    });
  }

  if (essay.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }

  if (!essay.result) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_GRADED',
        message: 'Essay has not been graded yet'
      }
    });
  }

  return sendSuccess(res, essay.result);
}));

// POST /api/essays/:id/regrade - Regrade essay (create new version)
router.post('/:id/regrade', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_CONTENT',
        message: 'Content is required for regrading'
      }
    });
  }

  const originalEssay = await prisma.essay.findUnique({
    where: { id }
  });

  if (!originalEssay) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Essay not found'
      }
    });
  }

  if (originalEssay.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }

  // Create new version
  const newVersion = await prisma.essay.create({
    data: {
      userId,
      rubricId: originalEssay.rubricId,
      title: originalEssay.title,
      content,
      source: 'text',
      parentId: originalEssay.id,
      versionNumber: originalEssay.versionNumber + 1,
      status: 'pending'
    }
  });

  return sendSuccess(res, newVersion, 201);
}));

// GET /api/essays/:id/compare - Compare versions
router.get('/:id/compare', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  const { version1, version2 } = req.query;

  if (!version1 || !version2) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'version1 and version2 are required'
      }
    });
  }

  const essay = await prisma.essay.findUnique({
    where: { id }
  });

  if (!essay) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Essay not found'
      }
    });
  }

  if (essay.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }

  const v1 = await prisma.essay.findFirst({
    where: {
      parentId: id,
      versionNumber: parseInt(version1 as string)
    },
    include: { result: true }
  });

  const v2 = await prisma.essay.findFirst({
    where: {
      parentId: id,
      versionNumber: parseInt(version2 as string)
    },
    include: { result: true }
  });

  if (!v1 || !v2) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'VERSION_NOT_FOUND',
        message: 'One or both versions not found'
      }
    });
  }

  const comparison = {
    scoreChange: {
      overall: {
        before: v1.result?.overallScore || 0,
        after: v2.result?.overallScore || 0,
        difference: (v2.result?.overallScore || 0) - (v1.result?.overallScore || 0)
      },
      dimensions: (((v2.result?.dimensionScores as unknown) as any[]) || []).map((dim2: any) => {
        const dim1 = (((v1.result?.dimensionScores as unknown) as any[]) || []).find((d: any) => d.dimensionId === dim2.dimensionId);
        return {
          dimensionName: dim2.dimensionName,
          before: dim1?.score || 0,
          after: dim2.score,
          change: dim2.score - (dim1?.score || 0)
        };
      })
    },
    improvements: v2.result?.improvements || [],
    maintainedStrengths: v2.result?.strengths || []
  };

  return sendSuccess(res, comparison);
}));

export default router;
