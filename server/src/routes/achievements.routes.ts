import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, asyncHandler } from '../middleware/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_grading',
    name: '初学者',
    description: '完成首次作文批改',
    type: 'beginner',
    icon: '🌟',
    xpReward: 10,
    condition: { type: 'essays_count', threshold: 1 }
  },
  {
    id: '10_essays',
    name: '笔耕不辍',
    description: '累计批改10篇作文',
    type: 'beginner',
    icon: '✍️',
    xpReward: 50,
    condition: { type: 'essays_count', threshold: 10 }
  },
  {
    id: '50_essays',
    name: '小有所成',
    description: '累计批改50篇作文',
    type: 'beginner',
    icon: '📝',
    xpReward: 200,
    condition: { type: 'essays_count', threshold: 50 }
  },
  {
    id: 'streak_3',
    name: '坚持Day 3',
    description: '连续3天提交作文',
    type: 'streak',
    icon: '🔥',
    xpReward: 30,
    condition: { type: 'streak_days', threshold: 3 }
  },
  {
    id: 'streak_7',
    name: '坚持Day 7',
    description: '连续7天提交作文',
    type: 'streak',
    icon: '📅',
    xpReward: 100,
    condition: { type: 'streak_days', threshold: 7 }
  },
  {
    id: 'streak_30',
    name: '坚持Day 30',
    description: '连续30天提交作文',
    type: 'streak',
    icon: '🏆',
    xpReward: 500,
    condition: { type: 'streak_days', threshold: 30 }
  },
  {
    id: 'high_score_90',
    name: '高分作文',
    description: '获得90分以上评分',
    type: 'quality',
    icon: '⭐',
    xpReward: 50,
    condition: { type: 'high_score', threshold: 90 }
  },
  {
    id: 'improvement_20',
    name: '进步之星',
    description: '同一篇作文修改后分数提升20%以上',
    type: 'quality',
    icon: '📈',
    xpReward: 30,
    condition: { type: 'improvement', threshold: 20 }
  }
];

// Level definitions
const LEVELS = [
  { level: 1, title: '写作新手', minXP: 0, maxXP: 100 },
  { level: 2, title: '写作入门', minXP: 100, maxXP: 500 },
  { level: 3, title: '写作进阶', minXP: 500, maxXP: 1500 },
  { level: 4, title: '写作能手', minXP: 1500, maxXP: 5000 },
  { level: 5, title: '写作高手', minXP: 5000, maxXP: 10000 },
  { level: 6, title: '写作大师', minXP: 10000, maxXP: Infinity }
];

// GET /api/achievements - List all achievements
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, ACHIEVEMENTS);
}));

// GET /api/achievements/user - Get user achievements
router.get('/user', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    orderBy: { achievedAt: 'desc' }
  });

  // Format response
  const formatted = userAchievements.map((ua: any) => ({
    ...ua.achievement,
    achievedAt: ua.achievedAt,
    progress: ua.progress
  }));

  return sendSuccess(res, formatted);
}));

// GET /api/achievements/progress - Get achievement progress
router.get('/progress', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  // Get user's essays count
  const essayCount = await prisma.essay.count({
    where: { userId, status: 'graded' }
  });

  // Get high scores count
  const highScores = await prisma.essay.count({
    where: {
      userId,
      status: 'graded',
      result: {
        overallScore: { gte: 90 }
      }
    }
  });

  // Get streak (simplified - essays submitted on different days)
  const essays = await prisma.essay.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate streak
  let streak = 0;
  if (essays.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < essays.length; i++) {
      const essayDate = new Date(essays[i].createdAt);
      essayDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - essayDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === i) {
        streak++;
      } else {
        break;
      }
    }
  }

  const progress = {
    essaysCount: essayCount,
    highScoresCount: highScores,
    currentStreak: streak,
    achievements: ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: false,
      progress: calculateProgress(ach, { essayCount, highScores, streak })
    }))
  };

  return sendSuccess(res, progress);
}));

// Helper function to calculate progress
function calculateProgress(achievement: any, stats: any) {
  switch (achievement.condition.type) {
    case 'essays_count':
      return Math.min(100, Math.floor((stats.essayCount / achievement.condition.threshold) * 100));
    case 'streak_days':
      return Math.min(100, Math.floor((stats.streak / achievement.condition.threshold) * 100));
    case 'high_score':
      return stats.highScores > 0 ? 100 : 0;
    default:
      return 0;
  }
}

// POST /api/achievements/check - Check and unlock achievements
router.post('/check', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  // Get current user stats
  const essayCount = await prisma.essay.count({
    where: { userId, status: 'graded' }
  });

  const highScores = await prisma.gradingResult.count({
    where: {
      essay: { userId },
      overallScore: { gte: 90 }
    }
  });

  // Get already unlocked achievements
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true }
  });
  const unlockedIds = new Set(unlocked.map((u: any) => u.achievementId));

  // Check each achievement
  const newlyUnlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;
    switch (achievement.condition.type) {
      case 'essays_count':
        shouldUnlock = essayCount >= achievement.condition.threshold;
        break;
      case 'high_score':
        shouldUnlock = highScores >= 1;
        break;
    }

    if (shouldUnlock) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: 100
        }
      });

      // Update user XP
      await updateUserXP(userId, achievement.xpReward);

      newlyUnlocked.push(achievement);
    }
  }

  return sendSuccess(res, {
    newlyUnlocked,
    totalUnlocked: unlockedIds.size + newlyUnlocked.length
  });
}));

// Helper to update user XP
async function updateUserXP(userId: string, xpGained: number) {
  const userLevel = await prisma.userLevel.findUnique({
    where: { userId }
  });

  if (!userLevel) return;

  let newTotalXP = userLevel.totalXP + xpGained;
  let newCurrentXP = userLevel.currentXP + xpGained;
  let newLevel = userLevel.currentLevel;
  let newTitle = userLevel.title;

  // Check level up
  const nextLevel = LEVELS.find(l => l.level === newLevel + 1);
  if (nextLevel && newCurrentXP >= (nextLevel.maxXP - nextLevel.minXP)) {
    newLevel++;
    newCurrentXP = newCurrentXP - (nextLevel.maxXP - nextLevel.minXP);
    newTitle = nextLevel.title;
  }

  await prisma.userLevel.update({
    where: { userId },
    data: {
      totalXP: newTotalXP,
      currentXP: newCurrentXP,
      currentLevel: newLevel,
      title: newTitle
    }
  });
}

// GET /api/users/level - Get user level
router.get('/level', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const userLevel = await prisma.userLevel.findUnique({
    where: { userId }
  });

  if (!userLevel) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User level not found'
      }
    });
  }

  const currentLevelData = LEVELS.find(l => l.level === userLevel.currentLevel);
  const nextLevel = LEVELS.find(l => l.level === userLevel.currentLevel + 1);

  return sendSuccess(res, {
    ...userLevel,
    xpToNextLevel: nextLevel ? (nextLevel.maxXP - nextLevel.minXP) - userLevel.currentXP : 0,
    maxXPForCurrentLevel: currentLevelData ? currentLevelData.maxXP - currentLevelData.minXP : 0
  });
}));

export default router;
