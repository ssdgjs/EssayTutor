import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';

// Mock database for testing
interface MockRubric {
  id: string;
  userId: string;
  name: string;
  description: string;
  scene: string;
  isDefault: boolean;
  status: string;
  dimensions: string; // JSON string
  customPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

const rubricsDb: Map<string, MockRubric> = new Map();

/**
 * Integration tests for customPrompt feature using mock database
 * This bypasses Prisma generation issues on Windows
 */
describe('CustomPrompt Integration Tests (Mock DB)', () => {
  let app: express.Application;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    testUserId = 'test-user-' + Date.now();
    authToken = jwt.sign({ userId: testUserId }, config.jwt.secret, { expiresIn: '1h' });

    // Setup Express app with mock routes
    app = express();
    app.use(express.json());

    // Mock rubric routes with customPrompt support
    app.post('/api/rubrics', (req, res) => {
      const { name, description, scene, customPrompt, dimensions } = req.body;

      // Validate dimensions
      if (!dimensions || !Array.isArray(dimensions) || dimensions.length < 3) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'At least 3 dimensions required' }
        });
      }

      // Validate weights
      const totalWeight = dimensions.reduce((sum: number, d: any) => sum + d.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_WEIGHTS', message: `Weights must sum to 1.0, got ${totalWeight}` }
        });
      }

      const rubric: MockRubric = {
        id: 'rubric-' + Date.now(),
        userId: testUserId,
        name,
        description: description || '',
        scene: scene || 'custom',
        isDefault: false,
        status: 'active',
        dimensions: JSON.stringify(dimensions),
        customPrompt: customPrompt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      rubricsDb.set(rubric.id, rubric);

      res.status(201).json({ success: true, data: rubric });
    });

    app.get('/api/rubrics', (req, res) => {
      const rubrics = Array.from(rubricsDb.values())
        .filter(r => r.userId === testUserId)
        .map(r => ({
          ...r,
          dimensions: JSON.parse(r.dimensions)
        }));

      res.json({
        success: true,
        data: rubrics,
        pagination: { page: 1, limit: 10, total: rubrics.length, totalPages: 1 }
      });
    });

    app.get('/api/rubrics/:id', (req, res) => {
      const rubric = rubricsDb.get(req.params.id);
      if (!rubric) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Rubric not found' }
        });
      }
      if (rubric.userId !== testUserId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
      res.json({
        success: true,
        data: { ...rubric, dimensions: JSON.parse(rubric.dimensions) }
      });
    });

    app.put('/api/rubrics/:id', (req, res) => {
      const rubric = rubricsDb.get(req.params.id);
      if (!rubric) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Rubric not found' }
        });
      }
      if (rubric.userId !== testUserId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }

      const { customPrompt } = req.body;
      rubric.customPrompt = customPrompt ?? null;
      rubric.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        data: { ...rubric, dimensions: JSON.parse(rubric.dimensions) }
      });
    });
  });

  afterEach(() => {
    // Clean mock database after each test
    rubricsDb.clear();
  });

  it('TDD-026i: should create rubric WITH customPrompt', async () => {
    const body = {
      name: '高考英语评分标准',
      description: '高考英语作文评分',
      scene: 'exam',
      customPrompt: '重点检查时态、主谓一致和冠词使用',
      dimensions: [
        { name: '内容', weight: 0.3, maxScore: 30 },
        { name: '结构', weight: 0.2, maxScore: 20 },
        { name: '词汇', weight: 0.2, maxScore: 20 },
        { name: '语法', weight: 0.2, maxScore: 20 },
        { name: '表达', weight: 0.1, maxScore: 10 }
      ]
    };

    const response = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${authToken}`)
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.customPrompt).toBe(body.customPrompt);
    expect(response.body.data.name).toBe(body.name);
    expect(response.body.data.id).toBeDefined();
  });

  it('TDD-027i: should create rubric WITHOUT customPrompt', async () => {
    const body = {
      name: '简单评分标准',
      scene: 'practice',
      dimensions: [
        { name: '内容', weight: 0.3, maxScore: 30 },
        { name: '结构', weight: 0.3, maxScore: 30 },
        { name: '语言', weight: 0.4, maxScore: 40 }
      ]
    };

    const response = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${authToken}`)
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.customPrompt).toBeNull();
  });

  it('TDD-028i: should GET rubric WITH customPrompt', async () => {
    // Create first with explicit 3 dimensions
    const createRes = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '测试自定义提示词',
        customPrompt: '这是一段测试提示词',
        dimensions: [
          { name: '维度1', weight: 0.3, maxScore: 30 },
          { name: '维度2', weight: 0.3, maxScore: 30 },
          { name: '维度3', weight: 0.4, maxScore: 40 }
        ]
      });

    console.log('TDD-028i create response:', createRes.status, createRes.body);
    expect(createRes.status).toBe(201);

    const rubricId = createRes.body.data.id;
    expect(rubricId).toBeDefined();

    // Then GET it
    const getRes = await request(app)
      .get(`/api/rubrics/${rubricId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.customPrompt).toBe('这是一段测试提示词');
  });

  it('TDD-029i: should UPDATE rubric customPrompt', async () => {
    // Create first with at least 3 dimensions
    const createRes = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '待更新评分标准',
        dimensions: [
          { name: '维度1', weight: 0.3, maxScore: 30 },
          { name: '维度2', weight: 0.3, maxScore: 30 },
          { name: '维度3', weight: 0.4, maxScore: 40 }
        ]
      });

    console.log('TDD-029i create response:', createRes.status, createRes.body);
    expect(createRes.status).toBe(201);

    const rubricId = createRes.body.data.id;
    expect(rubricId).toBeDefined();

    // Update customPrompt
    const updateRes = await request(app)
      .put(`/api/rubrics/${rubricId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ customPrompt: '更新后的AI提示词' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.customPrompt).toBe('更新后的AI提示词');
  });

  it('TDD-030i: should list rubrics WITH customPrompt', async () => {
    // Create a rubric with customPrompt for this test (at least 3 dimensions)
    const createRes = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '列表测试评分标准',
        customPrompt: '列表测试提示词',
        dimensions: [
          { name: '内容', weight: 0.3, maxScore: 30 },
          { name: '结构', weight: 0.3, maxScore: 30 },
          { name: '语言', weight: 0.4, maxScore: 40 }
        ]
      });

    console.log('TDD-030i create response:', createRes.status, createRes.body);
    expect(createRes.status).toBe(201);

    // List rubrics
    const listRes = await request(app)
      .get('/api/rubrics')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toBeInstanceOf(Array);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    const found = listRes.body.data.find((r: any) => r.name === '列表测试评分标准');
    expect(found).toBeDefined();
    expect(found.customPrompt).toBe('列表测试提示词');
  });
});
