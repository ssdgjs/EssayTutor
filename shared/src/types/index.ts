// 用户相关类型
export interface User {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  role: 'student' | 'teacher';
  createdAt: string;
  updatedAt: string;
}

// 评分标准类型
export interface Rubric {
  id: string;
  userId: string;
  name: string;
  description: string;
  scene: 'exam' | 'practice' | 'custom';
  isDefault: boolean;
  dimensions: RubricDimension[];
  status: 'draft' | 'active';
  createdAt: string;
  updatedAt: string;
}

export interface RubricDimension {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  criteria: string;
}

// 作文类型
export interface Essay {
  id: string;
  userId: string;
  rubricId: string;
  title?: string;
  content: string;
  source: 'text' | 'photo';
  photoUrl?: string;
  status: 'pending' | 'graded' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// 批改结果类型
export interface GradingResult {
  id: string;
  essayId: string;
  rubricId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  overallScore: number;
  maxScore: number;
  dimensionScores: DimensionScore[];
  strengths: string[];
  improvements: Improvement[];
  comments: SentenceComment[];
  overallFeedback: string;
  aiModel: string;
  processingTime: number;
  createdAt: string;
}

export interface DimensionScore {
  dimensionId: string;
  dimensionName: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface Improvement {
  type: 'grammar' | 'vocabulary' | 'structure' | 'content';
  original: string;
  suggestion: string;
  explanation: string;
  lineNumber: number;
}

export interface SentenceComment {
  lineNumber: number;
  originalText: string;
  comment: string;
  suggestion?: string;
}

// 成就系统类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: 'beginner' | 'streak' | 'quality' | 'share';
  icon: string;
  xpReward: number;
  condition: {
    type: string;
    threshold: number;
  };
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievedAt: string;
}

export interface UserLevel {
  userId: string;
  currentLevel: number;
  currentXP: number;
  totalXP: number;
  title: string;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 分页类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
