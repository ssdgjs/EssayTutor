import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendSuccess, asyncHandler } from '../middleware/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Dimension schema
const dimensionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  weight: z.number().min(0).max(1),
  maxScore: z.number().int().positive(),
  criteria: z.string().optional(),
  levels: z.array(z.object({
    score: z.number(),
    description: z.string()
  })).optional()
});

// Rubric validation schema
const rubricSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  scene: z.enum(['exam', 'practice', 'custom']).default('custom'),
  dimensions: z.array(dimensionSchema).min(3, 'At least 3 dimensions required').max(5, 'Maximum 5 dimensions allowed'),
  customPrompt: z.string().optional()
});

// Validation middleware
function validateDimensions(dimensions: any[]) {
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    return {
      valid: false,
      error: `Dimension weights must sum to 1.0, got ${totalWeight}`
    };
  }
  return { valid: true };
}

// GET /api/rubrics - List rubrics
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;

  const where: any = { userId };
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [rubrics, total] = await Promise.all([
    prisma.rubric.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.rubric.count({ where })
  ]);

  // Parse dimensions JSON string
  const parsedRubrics = rubrics.map((r: any) => ({
    ...r,
    dimensions: JSON.parse(r.dimensions)
  }));

  return sendSuccess(res, {
    data: parsedRubrics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// POST /api/rubrics - Create rubric
router.post('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  // Validate schema
  const result = rubricSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0].message
      }
    });
  }

  const { name, description, scene, dimensions, customPrompt } = result.data;

  // Validate dimension weights
  const weightValidation = validateDimensions(dimensions);
  if (!weightValidation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_WEIGHTS',
        message: weightValidation.error
      }
    });
  }

  // Log the incoming data for debugging
  console.log('[Rubric] Creating rubric:', { name, scene, dimensions: dimensions.length, customPrompt });

  // Create rubric
  const rubric = await prisma.rubric.create({
    data: {
      userId,
      name,
      description: description || '',
      scene,
      dimensions: JSON.stringify(dimensions) as any,
      customPrompt: customPrompt ?? null,
      isDefault: false,
      status: 'active'
    }
  });

  return sendSuccess(res, rubric, 201);
}));

// GET /api/rubrics/:id - Get single rubric
router.get('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const rubric = await prisma.rubric.findUnique({
    where: { id }
  });

  if (!rubric) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Rubric not found'
      }
    });
  }

  if (rubric.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this rubric'
      }
    });
  }

  // Parse dimensions JSON string
  const parsedRubric = {
    ...rubric,
    dimensions: JSON.parse((rubric.dimensions as string) || '[]')
  };

  return sendSuccess(res, parsedRubric);
}));

// PUT /api/rubrics/:id - Update rubric
router.put('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  // Check ownership
  const existing = await prisma.rubric.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Rubric not found' }
    });
  }

  if (existing.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' }
    });
  }

  // Validate dimensions if provided
  if (req.body.dimensions) {
    const weightValidation = validateDimensions(req.body.dimensions);
    if (!weightValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_WEIGHTS', message: weightValidation.error }
      });
    }
  }

  // Convert dimensions to JSON string if provided
  const updateData = { ...req.body };
  if (updateData.dimensions) {
    updateData.dimensions = JSON.stringify(updateData.dimensions);
  }

  const rubric = await prisma.rubric.update({
    where: { id },
    data: updateData
  });

  // Parse dimensions JSON string
  const parsedRubric = {
    ...rubric,
    dimensions: JSON.parse((rubric.dimensions as string) || '[]')
  };

  return sendSuccess(res, parsedRubric);
}));

// DELETE /api/rubrics/:id - Delete rubric
router.delete('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const existing = await prisma.rubric.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Rubric not found' }
    });
  }

  if (existing.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' }
    });
  }

  if (existing.isDefault) {
    return res.status(400).json({
      success: false,
      error: { code: 'CANNOT_DELETE_DEFAULT', message: 'Cannot delete default rubric' }
    });
  }

  await prisma.rubric.delete({ where: { id } });

  return res.status(204).send();
}));

// POST /api/rubrics/:id/default - Set as default
router.post('/:id/default', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  // Clear existing default
  await prisma.rubric.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false }
  });

  // Set new default
  const rubric = await prisma.rubric.update({
    where: { id },
    data: { isDefault: true }
  });

  // Parse dimensions JSON string
  const parsedRubric = {
    ...rubric,
    dimensions: JSON.parse((rubric.dimensions as string) || '[]')
  };

  return sendSuccess(res, parsedRubric);
}));

// POST /api/rubrics/optimize-prompt - AI优化提示词
router.post('/optimize-prompt', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { rubricName, dimensions, customPrompt } = req.body;

  if (!rubricName || !dimensions) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_DATA', message: 'rubricName and dimensions are required' }
    });
  }

  // 调用AI生成优化的提示词
  console.log('[Optimize] Starting AI optimization for rubric:', rubricName);
  
  try {
    const { zhipuClient } = await import('../services/ai.service.js');
    
    console.log('[Optimize] Calling Zhipu API...');
    
    const response = await zhipuClient.chat.completions.create({
      model: 'glm-4.5-air',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的英语作文评分标准设计专家。你的任务是帮助用户优化或创建更适合的AI评分提示词。
要求：
1. 根据评分维度的名称和描述，生成更详细、更专业的评分指导
2. 考虑中国学生英语写作的常见问题，给出具体的评分建议
3. 输出必须是纯JSON格式，不要markdown标记`
        },
        {
          role: 'user',
          content: `请为以下英语作文评分标准生成优化的AI提示词：

评分标准名称：${rubricName}
现有提示词（可选）：${customPrompt || '无'}

评分维度：
${JSON.stringify(dimensions, null, 2)}

请生成一个更详细、更专业的AI评分提示词，帮助AI更准确地根据这些维度进行评分。
提示词应该包含：
1. 对每个维度的详细解释
2. 不同分数段的评分标准
3. 中国学生常见的写作问题和扣分点

输出JSON格式：
{
  "optimizedPrompt": "优化后的完整提示词",
  "suggestions": ["优化建议1", "优化建议2"]
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let content = response.choices[0]?.message?.content || '';
    content = content.replace(/```json?/g, '').replace(/```/g, '').trim();

    console.log('[Optimize] AI response received');

    try {
      const parsed = JSON.parse(content);
      return sendSuccess(res, parsed);
    } catch {
      return sendSuccess(res, { optimizedPrompt: content, suggestions: [] });
    }
  } catch (error: any) {
    console.error('[Optimize] AI API error:', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'AI_ERROR', message: 'AI服务暂时不可用，请稍后重试' }
    });
  }
}));

// POST /api/rubrics/suggest - AI suggestion
router.post('/suggest', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { scene, topic, grade } = req.body;

  // Mock AI suggestion for now
  const suggestedRubric = {
    name: `${scene || '通用'}英语作文评分标准`,
    description: `适用于${grade || '各年级'}${topic || '各类'}作文`,
    scene: scene || 'custom',
    dimensions: [
      {
        name: '内容',
        description: '主题相关性、论点清晰度、论据充分性',
        weight: 0.3,
        maxScore: 30,
        criteria: '内容充实，论点清晰',
        levels: [
          { score: 27, description: '优秀：内容充实，论述深入' },
          { score: 24, description: '良好：内容完整，论述清晰' },
          { score: 21, description: '中等：内容基本完整' }
        ]
      },
      {
        name: '结构',
        description: '段落组织、逻辑连贯、过渡自然',
        weight: 0.2,
        maxScore: 20,
        criteria: '结构合理，逻辑清晰',
        levels: [
          { score: 18, description: '优秀' },
          { score: 16, description: '良好' }
        ]
      },
      {
        name: '词汇',
        description: '词汇丰富度、准确性、拼写',
        weight: 0.2,
        maxScore: 20,
        criteria: '词汇丰富，使用准确'
      },
      {
        name: '语法',
        description: '句式多样性、语法正确性、时态',
        weight: 0.2,
        maxScore: 20,
        criteria: '语法正确，句式多样'
      },
      {
        name: '表达',
        description: '语言流畅度、表达地道性、修辞',
        weight: 0.1,
        maxScore: 10,
        criteria: '表达流畅，语言地道'
      }
    ]
  };

  return sendSuccess(res, suggestedRubric);
}));

export default router;
