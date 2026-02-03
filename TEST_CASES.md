# TDD 测试用例设计

**开发模式:** Test-Driven Development  
**测试框架:** Vitest (已配置)  
**测试策略:** 单元测试 + 集成测试 + E2E测试

---

## 一、测试目录结构

```
server/
├── src/
│   └── (source code)
└── tests/
    ├── unit/                    # 单元测试 (70%)
    │   ├── services/
    │   │   ├── ai.service.test.ts
    │   │   ├── rubric.service.test.ts
    │   │   └── user.service.test.ts
    │   ├── utils/
    │   │   └── jwt.test.ts
    │   └── models/
    │       └── rubric.test.ts
    ├── integration/             # 集成测试 (20%)
    │   ├── auth.test.ts
    │   ├── rubrics.test.ts
    │   ├── essays.test.ts
    │   └── grading.test.ts
    ├── e2e/                    # E2E测试 (10%)
    │   └── user-flow.test.ts
    └── setup.ts                # 测试环境配置
```

---

## 二、测试用例详情

### Sprint 1: 基础设施 (Week 1)

#### 2.1 用户认证系统 (Auth)

**文件:** `server/tests/integration/auth.test.ts`

```typescript
describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    // Test 1: 基本注册
    test('should create new user with valid email and password', async () => {
      const body = {
        email: 'test@example.com',
        password: 'Secure123!',
        displayName: 'Test User'
      };
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(body.email);
      expect(response.body.data.user.password).toBeUndefined(); // 不返回密码
      expect(response.body.data.token).toBeDefined();
    });

    // Test 2: 邮箱格式验证
    test('should return 400 for invalid email format', async () => {
      const body = {
        email: 'invalid-email',
        password: 'Secure123!',
        displayName: 'Test'
      };
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_EMAIL');
    });

    // Test 3: 密码强度验证
    test('should return 400 for weak password', async () => {
      const body = {
        email: 'test@example.com',
        password: '123',
        displayName: 'Test'
      };
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
    });

    // Test 4: 重复邮箱
    test('should return 409 for duplicate email', async () => {
      // 先创建用户
      await createUser({ email: 'test@example.com' });
      
      // 再次注册相同邮箱
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    // Test 5: 必填字段缺失
    test('should return 400 for missing required fields', async () => {
      const body = { email: 'test@example.com' }; // 缺少password
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    // Test 1: 正常登录
    test('should return token for valid credentials', async () => {
      // Setup: 创建用户
      await createUser({ 
        email: 'test@example.com', 
        password: 'Secure123!' 
      });
      
      const body = {
        email: 'test@example.com',
        password: 'Secure123!'
      };
      
      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(body.email);
    });

    // Test 2: 密码错误
    test('should return 401 for wrong password', async () => {
      await createUser({ email: 'test@example.com', password: 'correct' });
      
      const body = {
        email: 'test@example.com',
        password: 'wrong'
      };
      
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    // Test 3: 用户不存在
    test('should return 401 for non-existent user', async () => {
      const body = {
        email: 'notexist@example.com',
        password: 'Secure123!'
      };
      
      expect(response.status).toBe(401);
    });

    // Test 4: 请求参数缺失
    test('should return 400 for missing fields', async () => {
      const body = { email: 'test@example.com' };
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    // Test 1: 获取当前用户
    test('should return current user with valid token', async () => {
      const user = await createUser();
      const token = await login(user);
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
    });

    // Test 2: 无Token
    test('should return 401 without token', async () => {
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    // Test 3: 无效Token
    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should return new access token with valid refresh token', async () => {
      // Implementation
    });

    test('should return 401 with invalid refresh token', async () => {
      // Implementation
    });
  });
});
```

---

#### 2.2 评分标准管理 (Rubrics)

**文件:** `server/tests/integration/rubrics.test.ts`

```typescript
describe('Rubrics API', () => {
  let authToken: string;
  let user: User;

  beforeEach(async () => {
    user = await createUser();
    authToken = await login(user);
  });

  describe('POST /api/rubrics', () => {
    // Test 1: 创建基础评分标准
    test('should create rubric with valid data', async () => {
      const body = {
        name: '中考英语作文评分标准',
        description: '适用于初中英语作文批改',
        scene: 'exam',
        dimensions: [
          {
            name: '内容',
            description: '主题相关性、论点清晰度',
            weight: 0.3,
            maxScore: 30,
            criteria: '内容充实，论点清晰',
            levels: [
              { score: 27, description: '优秀' },
              { score: 24, description: '良好' }
            ]
          },
          {
            name: '结构',
            description: '段落组织、逻辑连贯',
            weight: 0.2,
            maxScore: 20,
            criteria: '结构合理，逻辑清晰'
          }
        ]
      };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        name: body.name,
        scene: body.scene,
        dimensions: expect.arrayContaining([
          expect.objectContaining({ name: '内容' })
        ])
      });
      expect(response.body.data.userId).toBe(user.id);
    });

    // Test 2: 权重总和验证 (必须 = 1.0)
    test('should return 400 if dimension weights do not sum to 1.0', async () => {
      const body = {
        name: 'Test Rubric',
        dimensions: [
          { name: '维度1', weight: 0.5, maxScore: 50 },
          { name: '维度2', weight: 0.3, maxScore: 30 } // 总和0.8
        ]
      };

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_WEIGHTS');
      expect(response.body.error.message).toContain('权重总和');
    });

    // Test 3: 维度数量验证 (3-5个)
    test('should return 400 for invalid dimension count', async () => {
      const body = {
        name: 'Test',
        dimensions: [
          { name: '维度1', weight: 1.0, maxScore: 100 }
        ]
      };

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DIMENSION_COUNT');
    });

    // Test 4: 未授权访问
    test('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
    });

    // Test 5: 必填字段验证
    test('should return 400 for missing required fields', async () => {
      const body = { description: 'Missing name' };

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/rubrics', () => {
    // Test 1: 获取列表
    test('should return list of rubrics for authenticated user', async () => {
      // 创建2个评分标准
      await createRubric(user, { name: 'Rubric 1' });
      await createRubric(user, { name: 'Rubric 2' });

      const response = await request(app)
        .get('/api/rubrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name');
    });

    // Test 2: 空列表
    test('should return empty array if no rubrics', async () => {
      const response = await request(app)
        .get('/api/rubrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    // Test 3: 分页
    test('should support pagination', async () => {
      // 创建11个评分标准
      for (let i = 0; i < 11; i++) {
        await createRubric(user);
      }

      const response = await request(app)
        .get('/api/rubrics?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 11,
        totalPages: 2
      });
    });

    // Test 4: 搜索过滤
    test('should support search by name', async () => {
      await createRubric(user, { name: '中考标准' });
      await createRubric(user, { name: '高考标准' });

      const response = await request(app)
        .get('/api/rubrics?search=中考')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('中考');
    });
  });

  describe('GET /api/rubrics/:id', () => {
    test('should return rubric by id', async () => {
      const rubric = await createRubric(user);

      const response = await request(app)
        .get(`/api/rubrics/${rubric.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(rubric.id);
    });

    test('should return 404 for non-existent rubric', async () => {
      const response = await request(app)
        .get('/api/rubrics/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test('should return 403 if rubric belongs to other user', async () => {
      const otherUser = await createUser();
      const rubric = await createRubric(otherUser);

      const response = await request(app)
        .get(`/api/rubrics/${rubric.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/rubrics/:id', () => {
    test('should update rubric', async () => {
      const rubric = await createRubric(user, { name: 'Old Name' });

      const response = await request(app)
        .put(`/api/rubrics/${rubric.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
    });

    test('should return 400 for invalid update data', async () => {
      const rubric = await createRubric(user);

      const response = await request(app)
        .put(`/api/rubrics/${rubric.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dimensions: [] });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/rubrics/:id', () => {
    test('should delete rubric', async () => {
      const rubric = await createRubric(user);

      const response = await request(app)
        .delete(`/api/rubrics/${rubric.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      
      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/rubrics/${rubric.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getResponse.status).toBe(404);
    });

    test('should not delete default rubric', async () => {
      const rubric = await createRubric(user, { isDefault: true });

      const response = await request(app)
        .delete(`/api/rubrics/${rubric.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('CANNOT_DELETE_DEFAULT');
    });
  });

  describe('POST /api/rubrics/suggest', () => {
    test('should return AI suggested rubric for scene', async () => {
      const body = {
        scene: '中考',
        topic: '描述一次难忘的经历',
        grade: '初三'
      };

      const response = await request(app)
        .post('/api/rubrics/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send(body);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('dimensions');
      expect(response.body.data.dimensions.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data.dimensions[0]).toHaveProperty('weight');
      
      // 验证权重总和为1
      const totalWeight = response.body.data.dimensions
        .reduce((sum: number, d: any) => sum + d.weight, 0);
      expect(totalWeight).toBeCloseTo(1, 2);
    });

    test('should handle AI service error', async () => {
      // Mock AI service error
      jest.spyOn(aiService, 'suggestRubric').mockRejectedValue(new Error('AI Error'));

      const response = await request(app)
        .post('/api/rubrics/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scene: 'test' });

      expect(response.status).toBe(500);
    });
  });
});
```

---

#### 2.3 批改历史 (Essays)

**文件:** `server/tests/integration/essays.test.ts`

```typescript
describe('Essays API', () => {
  describe('POST /api/essays', () => {
    test('should create essay with text input', async () => {
      const rubric = await createRubric(user);
      const body = {
        rubricId: rubric.id,
        title: 'My First Essay',
        content: 'This is my essay content.',
        source: 'text'
      };

      const response = await request(app)
        .post('/api/essays')
        .set('Authorization', `Bearer ${authToken}`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        title: body.title,
        content: body.content,
        source: 'text',
        status: 'pending'
      });
    });

    test('should create essay with OCR input', async () => {
      const rubric = await createRubric(user);
      const body = {
        rubricId: rubric.id,
        photoUrl: 'https://example.com/essay.jpg',
        content: 'OCR recognized text',
        source: 'photo'
      };

      expect(response.status).toBe(201);
      expect(response.body.data.source).toBe('photo');
    });

    test('should trigger async grading job', async () => {
      // 验证批改任务已加入队列
      const job = await getGradingJob(essay.id);
      expect(job).toBeDefined();
      expect(job.status).toBe('pending');
    });
  });

  describe('GET /api/essays', () => {
    test('should return essay list with pagination', async () => {
      // 创建5篇作文
      for (let i = 0; i < 5; i++) {
        await createEssay(user);
      }

      const response = await request(app)
        .get('/api/essays?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });

    test('should support sorting by date', async () => {
      await createEssay(user, { createdAt: new Date('2024-01-01') });
      await createEssay(user, { createdAt: new Date('2024-01-15') });

      const response = await request(app)
        .get('/api/essays?sort=createdAt&order=desc')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.data[0].createdAt > response.body.data[1].createdAt).toBe(true);
    });

    test('should support filtering by status', async () => {
      await createEssay(user, { status: 'graded' });
      await createEssay(user, { status: 'pending' });

      const response = await request(app)
        .get('/api/essays?status=graded')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.data.every((e: Essay) => e.status === 'graded')).toBe(true);
    });
  });

  describe('GET /api/essays/:id/result', () => {
    test('should return grading result', async () => {
      const essay = await createEssay(user, { status: 'graded' });
      await createGradingResult(essay);

      const response = await request(app)
        .get(`/api/essays/${essay.id}/result`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('overallScore');
      expect(response.body.data).toHaveProperty('dimensionScores');
      expect(response.body.data).toHaveProperty('improvements');
    });

    test('should return 404 if essay not graded', async () => {
      const essay = await createEssay(user, { status: 'pending' });

      const response = await request(app)
        .get(`/api/essays/${essay.id}/result`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_GRADED');
    });
  });
});
```

---

### Sprint 2: 重批改对比 (Regrading)

**文件:** `server/tests/integration/regrading.test.ts`

```typescript
describe('Regrading API', () => {
  describe('POST /api/essays/:id/regrade', () => {
    test('should create new version and regrade', async () => {
      const originalEssay = await createEssay(user, {
        content: 'Original text'
      });
      await createGradingResult(originalEssay, { overallScore: 60 });

      const body = {
        content: 'Improved text with better grammar'
      };

      const response = await request(app)
        .post(`/api/essays/${originalEssay.id}/regrade`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('essayId');
      expect(response.body.data).toHaveProperty('versionNumber', 2);
    });
  });

  describe('GET /api/essays/:id/compare', () => {
    test('should return comparison between two versions', async () => {
      const essay = await createEssay(user, { versionNumber: 2 });
      const v1 = await getEssayVersion(essay, 1);
      const v2 = await getEssayVersion(essay, 2);
      
      await createGradingResult(v1, { overallScore: 60 });
      await createGradingResult(v2, { overallScore: 80 });

      const response = await request(app)
        .get(`/api/essays/${essay.id}/compare?version1=1&version2=2`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('scoreChange');
      expect(response.body.data.scoreChange).toEqual({
        before: 60,
        after: 80,
        difference: 20
      });
      expect(response.body.data).toHaveProperty('improvements');
    });
  });
});
```

---

### Sprint 3: 成就系统 (Achievements)

**文件:** `server/tests/integration/achievements.test.ts`

```typescript
describe('Achievements System', () => {
  describe('Achievement Unlock Logic', () => {
    test('should unlock "First Grading" on first essay graded', async () => {
      const essay = await createEssay(user);
      await gradeEssay(essay);

      await checkAchievements(user.id);

      const achievements = await getUserAchievements(user.id);
      expect(achievements).toContainEqual(
        expect.objectContaining({ achievementId: 'first_grading' })
      );
    });

    test('should unlock "10 Essays" on 10th essay graded', async () => {
      // 创建9篇已批改的作文
      for (let i = 0; i < 9; i++) {
        const essay = await createEssay(user);
        await gradeEssay(essay);
      }

      // 第10篇
      const essay10 = await createEssay(user);
      await gradeEssay(essay10);

      const achievements = await getUserAchievements(user.id);
      expect(achievements).toContainEqual(
        expect.objectContaining({ achievementId: '10_essays' })
      );
    });

    test('should unlock "High Score" when overallScore >= 90', async () => {
      const essay = await createEssay(user);
      await createGradingResult(essay, { overallScore: 92 });

      await checkAchievements(user.id);

      const achievements = await getUserAchievements(user.id);
      expect(achievements).toContainEqual(
        expect.objectContaining({ achievementId: 'high_score' })
      );
    });

    test('should unlock streak achievements', async () => {
      // 模拟连续7天提交
      for (let i = 0; i < 7; i++) {
        await createEssay(user, {
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        });
      }

      await checkStreakAchievements(user.id);

      const achievements = await getUserAchievements(user.id);
      expect(achievements).toContainEqual(
        expect.objectContaining({ achievementId: 'streak_7' })
      );
    });
  });

  describe('User Level System', () => {
    test('should calculate XP correctly', () => {
      const xp = calculateXP({
        essaysGraded: 5,
        achievements: ['first', '10_essays']
      });

      // 5篇作文 = 50 XP, 2个成就 = 70 XP
      expect(xp).toBe(120);
    });

    test('should level up when XP threshold reached', () => {
      const userLevel = calculateLevel({
        currentXP: 95,
        xpGained: 10
      });

      expect(userLevel.currentLevel).toBe(2); // 写作入门
      expect(userLevel.currentXP).toBe(5); // 105 - 100
    });

    test('should assign correct level title', () => {
      const titles = [
        { xp: 50, expected: '写作新手' },
        { xp: 150, expected: '写作入门' },
        { xp: 600, expected: '写作进阶' },
        { xp: 2000, expected: '写作能手' }
      ];

      titles.forEach(({ xp, expected }) => {
        expect(getLevelTitle(xp)).toBe(expected);
      });
    });
  });

  describe('GET /api/achievements/user', () => {
    test('should return user achievements with progress', async () => {
      await createEssay(user);
      await checkAchievements(user.id);

      const response = await request(app)
        .get('/api/achievements/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('achievement');
      expect(response.body.data[0]).toHaveProperty('achievedAt');
    });
  });
});
```

---

## 三、单元测试示例

**文件:** `server/tests/unit/services/ai.service.test.ts`

```typescript
describe('AI Service', () => {
  describe('gradeEssay', () => {
    test('should parse valid JSON response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```json\n{"overallScore": 85, "dimensionScores": []}\n```'
          }
        }]
      };

      jest.spyOn(zhipuClient.chat.completions, 'create')
        .mockResolvedValue(mockResponse as any);

      const result = await gradeEssay('test essay', { dimensions: [] });

      expect(result).toEqual({
        overallScore: 85,
        dimensionScores: []
      });
    });

    test('should handle invalid JSON gracefully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON'
          }
        }]
      };

      jest.spyOn(zhipuClient.chat.completions, 'create')
        .mockResolvedValue(mockResponse as any);

      await expect(gradeEssay('test', {}))
        .rejects.toThrow('Failed to parse AI response');
    });

    test('should construct correct prompt', async () => {
      const spy = jest.spyOn(zhipuClient.chat.completions, 'create')
        .mockResolvedValue({ choices: [{ message: { content: '{}' } }] } as any);

      await gradeEssay('test essay', {
        dimensions: [{ name: '内容', weight: 0.3 }]
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'glm-4.5-air',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('评分标准')
            })
          ]),
          temperature: 0.3
        })
      );
    });
  });
});
```

---

## 四、测试覆盖率要求

| 模块 | 单元测试 | 集成测试 | 合计 |
|------|---------|---------|------|
| Auth | 80% | 90% | 85% |
| Rubrics | 75% | 85% | 80% |
| Essays | 70% | 85% | 78% |
| AI Service | 85% | 70% | 78% |
| Achievements | 80% | 80% | 80% |
| **整体** | **78%** | **82%** | **80%** |

---

## 五、测试运行命令

```bash
# 运行所有测试
npm test

# 运行特定模块测试
npm test -- server/tests/auth

# 运行单元测试
npm test -- --testPathPattern=unit

# 运行集成测试
npm test -- --testPathPattern=integration

# 覆盖率报告
npm test -- --coverage

# 监视模式
npm test -- --watch

# 调试特定测试
npm test -- --verbose server/tests/auth/login.test.ts
```

---

## 六、等待确认

**请检查:**

- [ ] 测试用例覆盖所有API端点
- [ ] 边界条件测试充分
- [ ] 错误处理测试完整
- [ ] 测试组织结构合理
- [ ] 覆盖率目标可接受

**确认后回复:**
- ✅ "确认测试用例，开始研发"
- 📝 "需要修改X处" (请指出)

**下一步:**
收到确认后立即开始 Sprint 1 的 TDD 开发循环。
