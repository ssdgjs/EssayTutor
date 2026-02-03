# AsseyTutor TDD 开发计划

**基于PRD v3.0**  
**生成日期:** 2026-02-03  
**开发模式:** Test-Driven Development (TDD)

---

## 一、当前系统状态评估

### 已完成 ✅

| 模块 | 状态 | 说明 |
|------|------|------|
| AI批改API | ✅ 完成 | POST /api/ai/grade (智谱AI GLM-4.5-air) |
| OCR API | ✅ 完成 | POST /api/ai/ocr (火山引擎) |
| 移动端基础UI | ✅ 完成 | Home/Essay/Profile tabs |
| API响应封装 | ✅ 完成 | sendSuccess/sendError |
| 基础中间件 | ✅ 完成 | auth, response handlers |

### 未完成 ❌

| 模块 | 优先级 | 预估工作量 |
|------|--------|-----------|
| 用户认证系统 | P0 | 3天 |
| 评分标准管理 | P0 | 4天 |
| 批改历史 | P0 | 3天 |
| 数据库集成 | P0 | 5天 |
| 成就系统 | P1 | 4天 |
| 用户等级系统 | P1 | 2天 |
| 重批改对比 | P1 | 3天 |
| 推送通知 | P2 | 3天 |

---

## 二、TDD 开发原则

### 测试策略

```
测试金字塔:
├── 单元测试 (70%)
│   ├── 服务层测试 (AI服务、OCR服务)
│   ├── 工具函数测试
│   └── 数据模型测试
├── 集成测试 (20%)
│   ├── API端到端测试
│   └── 数据库操作测试
└── E2E测试 (10%)
    ├── 用户流程测试
    └── 关键功能验证
```

### 测试覆盖率要求

- **单元测试:** ≥ 80%
- **集成测试:** ≥ 60%
- **整体:** ≥ 75%

---

## 三、分阶段开发计划

### 阶段1: 基础设施完善 (1周)

**目标:** 搭建完整的后端基础设施

#### 1.1 数据库集成

| 任务 | 测试类型 | 依赖 |
|------|----------|------|
| PostgreSQL数据库设计 | Schema Review | 无 |
| Prisma ORM集成 | 集成测试 | 数据库 |
| 用户表迁移 | 单元测试 | Prisma |
| 评分标准表迁移 | 单元测试 | Prisma |
| 作文表迁移 | 单元测试 | Prisma |
| 批改结果表迁移 | 单元测试 | Prisma |

**测试文件:** `server/tests/db/*.ts`

#### 1.2 用户认证系统

| 任务 | 测试类型 | 依赖 |
|------|----------|------|
| JWT认证中间件 | 单元测试 | config |
| 登录API (POST /api/auth/login) | 集成测试 | DB, JWT |
| 注册API (POST /api/auth/register) | 集成测试 | DB |
| Token刷新API | 集成测试 | JWT |
| 密码加密 (bcrypt) | 单元测试 | 无 |

**测试文件:** `server/tests/auth/*.ts`

**API端点:**
```typescript
POST /api/auth/register     // 注册
POST /api/auth/login        // 登录
POST /api/auth/refresh      // 刷新Token
POST /api/auth/logout       // 登出
GET  /api/auth/me           // 获取当前用户
```

---

### 阶段2: 核心功能开发 (2周)

**目标:** 实现PRD核心功能

#### 2.1 评分标准管理模块

| 任务 | 测试类型 | 依赖 |
|------|----------|------|
| Rubric数据模型验证 | 单元测试 | shared types |
| 创建评分标准API | 集成测试 | Auth, DB |
| 获取评分标准列表API | 集成测试 | Auth, DB |
| 获取单个评分标准API | 集成测试 | Auth, DB |
| 更新评分标准API | 集成测试 | Auth, DB |
| 删除评分标准API | 集成测试 | Auth, DB |
| AI生成评分建议API | 集成测试 | Auth, AI服务 |
| 设为默认评分标准API | 集成测试 | Auth, DB |

**测试文件:** `server/tests/rubrics/*.ts`

**API端点:**
```typescript
GET    /api/rubrics              // 列表
POST   /api/rubrics              // 创建
GET    /api/rubrics/:id          // 详情
PUT    /api/rubrics/:id          // 更新
DELETE /api/rubrics/:id          // 删除
POST   /api/rubrics/:id/default  // 设为默认
POST   /api/rubrics/suggest      // AI建议
```

#### 2.2 批改历史模块

| 任务 | 测试类型 | 依赖 |
|------|----------|------|
| 保存批改结果 | 单元测试 | DB, AI服务 |
| 获取批改历史列表 | 集成测试 | Auth, DB |
| 获取批改详情 | 集成测试 | Auth, DB |
| 删除批改记录 | 集成测试 | Auth, DB |
| 导出批改记录 | 集成测试 | Auth, DB |

**测试文件:** `server/tests/essays/*.ts`

**API端点:**
```typescript
GET    /api/essays              // 批改历史列表
POST   /api/essays              // 提交批改
GET    /api/essays/:id          // 批改详情
DELETE /api/essays/:id          // 删除
GET    /api/essays/:id/result   // 获取批改结果
```

#### 2.3 重批改对比功能

| 任务 | 测试类型 | 依赖 |
|------|----------|------|
| 记录作文版本 | 单元测试 | DB |
| 对比批改API | 集成测试 | AI服务, DB |
| 生成对比报告 | 集成测试 | AI服务 |

**测试文件:** `server/tests/grading/*.ts`

**API端点:**
```typescript
POST   /api/essays/:id/regrade     // 重新批改
GET    /api/essays/:id/compare     // 获取对比报告
```

---

### 阶段3: 激励系统 (1周)

**目标:** 增加用户粘性

#### 3.1 成就系统

| 任务 | 测试类型 | 依赖 |
|------|----------|------|
| Achievement数据模型 | 单元测试 | shared types |
| 成就定义初始化 | 集成测试 | DB |
| 检查成就解锁 | 单元测试 | DB |
| 获取用户成就列表 | 集成测试 | Auth, DB |
| 成就通知 | 集成测试 | 推送服务 |

**测试文件:** `server/tests/achievements/*.ts`

**API端点:**
```typescript
GET    /api/achievements          // 成就列表
GET    /api/achievements/user     // 用户成就
POST   /api/achievements/check    // 检查解锁
```

#### 3.2 用户等级系统

| 任务 | 测试类型 | 依赖 |
|------|----------|------|
| UserLevel数据模型 | 单元测试 | shared types |
| XP计算规则 | 单元测试 | 无 |
| 等级更新逻辑 | 单元测试 | DB |
| 获取用户等级 | 集成测试 | Auth, DB |

**测试文件:** `server/tests/levels/*.ts`

**API端点:**
```typescript
GET    /api/users/level           // 获取等级
GET    /api/users/xp-history      // XP历史
```

---

## 四、TDD 开发流程

### 每个功能的标准流程

```bash
# 1. 编写测试 (RED)
npm test -- --run server/tests/xxx/

# 2. 实现功能 (GREEN)
# 编写代码使测试通过

# 3. 重构代码 (REFACTOR)
# 优化代码结构，保持测试通过

# 4. 运行完整测试套件
npm test
```

### 测试示例

```typescript
// server/tests/auth/login.test.ts
describe('POST /api/auth/login', () => {
  it('should return 400 if email is missing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ password: 'test123' });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should return token on valid credentials', async () => {
    // 先创建用户
    await createTestUser();
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'test123' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});
```

---

## 五、开发优先级排序

### Sprint 1 (第1周)

| 天数 | 任务 | 测试覆盖 |
|------|------|----------|
| Day 1-2 | 数据库设计 + Prisma集成 | Schema Review |
| Day 3-4 | 用户认证 (注册/登录) | 单元+集成测试 |
| Day 5 | 评分标准CRUD基础 | 集成测试 |

### Sprint 2 (第2周)

| 天数 | 任务 | 测试覆盖 |
|------|------|----------|
| Day 1-2 | 评分标准完整功能 | 集成测试 |
| Day 3-4 | 批改历史功能 | 集成测试 |
| Day 5 | 重批改对比 | 集成测试 |

### Sprint 3 (第3周)

| 天数 | 任务 | 测试覆盖 |
|------|------|----------|
| Day 1-2 | 成就系统 | 单元+集成测试 |
| Day 3 | 等级系统 | 单元测试 |
| Day 4-5 | E2E测试 + Bug修复 | 完整测试 |

---

## 六、验收标准

### 阶段1验收 (MVP)

- [ ] 用户可注册/登录 (JWT认证)
- [ ] 用户可创建/编辑/删除评分标准
- [ ] 用户可提交英文作文 (文本输入)
- [ ] AI返回多维度批改结果
- [ ] 用户可查看批改历史
- [ ] 测试覆盖率 ≥ 75%

### 阶段2验收 (完整功能)

- [ ] 所有MVP功能完成
- [ ] 重批改对比功能正常
- [ ] 成就系统解锁正常
- [ ] 用户等级更新正常
- [ ] 测试覆盖率 ≥ 80%

---

## 七、技术债务清理

| 项目 | 优先级 | 说明 |
|------|--------|------|
| 修复LSP诊断错误 | 高 | 当前有未修复的类型错误 |
| 添加缺失的依赖 | 高 | 确保package.json完整 |
| 完善.env.example | 中 | 环境变量文档 |
| 添加CI/CD配置 | 中 | GitHub Actions |

---

## 八、下一步行动

### 确认计划后执行

请确认以下内容：

1. **开发范围:** 是否包含所有PRD功能？
2. **时间安排:** Sprint时间是否合理？
3. **测试策略:** 测试覆盖率要求是否可接受？
4. **优先级:** 功能优先级是否需要调整？

### 确认后启动

确认后我将：
1. 创建测试文件
2. 运行第一个TDD循环
3. 按Sprint推进开发

---

**计划版本:** v1.0  
**待确认后执行**
