import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateTokens, verifyToken } from '../utils/jwt';
import { sendSuccess, asyncHandler } from '../middleware/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name is required'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0].message,
      },
    });
  }

  const { email, password, displayName } = result.data;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message: 'Email already registered',
      },
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      role: 'student',
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokens = generateTokens({ userId: user.id, email: user.email });

  // Create initial user level
  await prisma.userLevel.create({
    data: {
      userId: user.id,
      currentLevel: 1,
      currentXP: 0,
      totalXP: 0,
      title: '写作新手',
    },
  });

  return sendSuccess(res, {
    user,
    ...tokens,
  }, 201);
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
      },
    });
  }

  const { email, password } = result.data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }

  // Generate tokens
  const tokens = generateTokens({ userId: user.id, email: user.email });

  return sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
    ...tokens,
  });
}));

// GET /api/auth/me (protected)
router.get('/me', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  return sendSuccess(res, user);
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Refresh token is required',
      },
    });
  }

  try {
    const payload = verifyToken(refreshToken);
    const tokens = generateTokens({ userId: payload.userId, email: payload.email });
    
    return sendSuccess(res, tokens);
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired refresh token',
      },
    });
  }
}));

export default router;
