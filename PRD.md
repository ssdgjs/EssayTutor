# 智能英文作文批改APP - 产品需求文档(PRD)

## 1. 产品概述

### 1.1 产品名称
**智能英文作文批改APP**（英文名：SmartEssay Tutor）

### 1.2 产品定位
面向K12学生的智能英文作文批改学习工具，通过AI技术提供即时、详细的作文批改反馈，帮助学生提升英文写作能力。

### 1.3 核心价值主张
- **智能**：AI大模型提供专业、多维度的作文批改
- **个性化**：支持自定义评分标准，适应不同老师和考试要求
- **激励性**：成就系统激发学生学习动力
- **便捷性**：拍照上传、手写识别，随时随地批改

---

## 2. 用户画像

### 2.1 主要用户

| 用户类型 | 特征 | 需求 |
|---------|------|------|
| **学生用户** | K12学生，英语学习者 | 获得作文反馈、提升写作能力、查看进步轨迹 |
| **教师用户** | 英语老师、家长 | 创建评分标准、查看学生作业、跟踪学习进度 |

### 2.2 用户故事

**学生用户故事：**
- "我写完一篇英语作文，希望快速知道哪里写得好、哪里需要改进"
- "我想看到自己的写作进步，对比修改前后的变化"
- "我希望有一些成就和奖励，让学习更有动力"

**教师用户故事：**
- "我想根据考试标准创建评分维度，AI帮我快速批改"
- "我想查看学生的历史批改记录，了解他们的学习轨迹"

---

## 3. 功能需求

### 3.1 核心功能模块

```
┌─────────────────────────────────────────────────────────────┐
│                    智能英文作文批改APP                        │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│  评分标准   │   作文批改   │   成就系统   │    个人中心       │
│  管理模块   │   处理模块   │   激励模块   │    数据模块       │
├─────────────┼─────────────┼─────────────┼───────────────────┤
│ · 创建评分   │ · 拍照上传   │ · 成就解锁   │ · 批改历史        │
│ · AI建议    │ · 文字输入   │ · 每日目标   │ · 学习统计        │
│ · 确认/修改  │ · 异步批改   │ · 连续打卡   │ · 账户设置        │
│ · 维度管理   │ · 多维评分   │ · 等级徽章   │ · 订阅管理        │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

### 3.2 评分标准管理模块

#### 3.2.1 功能描述
教师/用户创建和管理作文评分标准，AI提供建议辅助。

#### 3.2.2 用户流程
```
┌─────────────────────────────────────────────────────────────────┐
│                      创建评分标准流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 选择评分场景          2. AI生成建议         3. 确认/修改      │
│  ┌─────────────────┐    ┌─────────────────┐   ┌─────────────────┐│
│  │ 选择：中考/高考/ │───→│ AI分析场景特点  │───→│ 查看AI建议      ││
│  │ 雅思/自定义     │    │ 生成评分维度建议 │   │ 可调整分值/权重 ││
│  └─────────────────┘    └─────────────────┘   └─────────────────┘│
│                                                  │               │
│                                                  ▼               │
│                                          ┌─────────────────┐    │
│                                          │ 确认评分标准    │    │
│                                          │ 保存并启用      │    │
│                                          └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2.3 评分维度设计
AI建议的默认评分维度（可自定义）：

| 维度 | 权重建议 | 分值范围 | 评分要点 |
|------|---------|---------|---------|
| **内容 Content** | 30% | 0-30分 | 主题相关性、论点清晰度、论据充分性 |
| **结构 Structure** | 20% | 0-20分 | 段落组织、逻辑连贯、过渡自然 |
| **词汇 Vocabulary** | 20% | 0-20分 | 词汇丰富度、词汇准确性、拼写 |
| **语法 Grammar** | 20% | 0-20分 | 句式多样性、语法正确性、时态 |
| **表达 Expression** | 10% | 0-10分 | 语言流畅度、表达地道性、修辞 |
| **总分** | 100% | 0-100分 | 综合评分 |

#### 3.2.4 评分标准数据模型
```typescript
interface Rubric {
  id: string                    // 唯一标识
  name: string                  // 评分标准名称（如"中考英语作文评分标准"）
  description: string           // 描述
  scene: 'exam' | 'practice' | 'custom'  // 场景类型
  createdBy: string             // 创建者ID
  isDefault: boolean            // 是否默认
  dimensions: RubricDimension[] // 评分维度列表
  status: 'draft' | 'active'    // 状态
  createdAt: Date
  updatedAt: Date
}

interface RubricDimension {
  id: string
  name: string                  // 维度名称（如"内容"、"结构"）
  description: string           // 评分说明
  weight: number                // 权重（百分比）
  maxScore: number              // 最高分
  criteria: string              // 评分细则描述
  levels: RubricLevel[]         // 等级描述
}

interface RubricLevel {
  score: number                 // 分值
  description: string           // 等级描述（如"优秀"、"良好"等）
  indicators: string[]          // 具体表现指标
}
```

### 3.3 作文批改处理模块

#### 3.3.1 功能描述
用户提交英文作文，AI根据评分标准进行批改，返回多维度评分和改进建议。

#### 3.3.2 用户流程
```
┌─────────────────────────────────────────────────────────────────────┐
│                        作文批改流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ 选择评分 │───→│ 提交作文 │───→│ 等待队列 │───→│ 批改完成     │  │
│  │ 标准     │    │ (拍照/输入)│    │ 等待通知 │    │ 查看结果     │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────┘  │
│                                                                      │
│  批改结果包含：                                                       │
│  - 综合评分（总分 + 各维度分数）                                       │
│  - 优点总结                                                          │
│  - 待改进点 + 具体建议                                               │
│  - 逐句批注（标注问题+修改建议）                                       │
│  - 参考范文（可选）                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.3.3 批改结果数据模型
```typescript
interface GradingResult {
  id: string
  essayId: string
  rubricId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  // 综合评分
  overallScore: number
  maxScore: number
  // 各维度评分
  dimensionScores: DimensionScore[]
  // 优点
  strengths: string[]
  // 待改进点
  improvements: Improvement[]
  // 逐句批注
  comments: SentenceComment[]
  // 综合评语
  overallFeedback: string
  // AI模型信息
  aiModel: string
  processingTime: number  // 处理耗时（秒）
  createdAt: Date
}

interface DimensionScore {
  dimensionId: string
  dimensionName: string
  score: number
  maxScore: number
  feedback: string
}

interface Improvement {
  type: 'grammar' | 'vocabulary' | 'structure' | 'content'
  original: string          // 原文
  suggestion: string        // 修改建议
  explanation: string       // 原因说明
  lineNumber: number        // 行号
}

interface SentenceComment {
  lineNumber: number
  originalText: string
  comment: string
  suggestion?: string
}
```

### 3.4 拍照识别功能

#### 3.4.1 功能描述
用户拍照上传作文图片，OCR自动识别文字内容。

#### 3.4.2 技术方案
- **OCR服务**：GLM-OCR（智谱AI）
  - SDK：zai-sdk
  - 模型：glm-ocr
  - 支持布局解析，适合作文图片识别

- **图片预处理**：
  - 自动校正倾斜
  - 灰度增强
  - 区域裁剪（识别作文区域）

#### 3.4.3 用户流程
```
拍照/选择图片 → 图片预处理 → OCR识别 → 文字校对 → 确认提交
```

### 3.5 成就系统模块

#### 3.5.1 功能描述
通过成就和等级系统激励用户持续学习。

#### 3.5.2 成就分类设计

| 成就类型 | 成就名称 | 达成条件 | 奖励 |
|---------|---------|---------|------|
| **入门成就** | 初学者 | 完成首次批改 | 解锁"新手徽章" |
| | 笔耕不辍 | 累计批改10篇 | 积分+50 |
| | 小有所成 | 累计批改50篇 | 积分+200 |
| **连续成就** | 坚持Day 1 | 连续1天提交作文 | 积分+10 |
| | 坚持Day 7 | 连续7天提交作文 | 积分+100 |
| | 坚持Day 30 | 连续30天提交作文 | 解锁"坚持者徽章" |
| **质量成就** | 进步之星 | 同一篇作文修改后分数提升20%+ | 积分+30 |
| | 高分作文 | 获得90分以上评分 | 解锁"高分徽章" |
| **分享成就** | 乐于分享 | 分享批改结果到社交平台 | 积分+20 |

#### 3.5.3 用户等级系统
```
等级1: 写作新手    (0-100 积分)
等级2: 写作入门    (100-500 积分)
等级3: 写作进阶    (500-1500 积分)
等级4: 写作能手    (1500-5000 积分)
等级5: 写作高手    (5000-10000 积分)
等级6: 写作大师    (10000+ 积分)
```

#### 3.5.4 成就数据模型
```typescript
interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  achievedAt: Date
  progress: number
}

interface UserLevel {
  userId: string
  currentLevel: number
  currentXP: number        // 当前等级经验值
  totalXP: number          // 累计获得经验值
  title: string            // 等级称号
}

interface Achievement {
  id: string
  name: string
  description: string
  type: 'beginner' | 'streak' | 'quality' | 'share'
  icon: string
  xpReward: number         // 奖励经验值
  condition: {             // 达成条件（动态计算）
    type: string
    threshold: number
  }
}
```

### 3.6 批改历史模块

#### 3.6.1 功能描述
保存用户历次批改记录，支持回顾、对比和导出。

#### 3.6.2 功能列表
- 批改列表：按时间/分数排序
- 详情查看：查看完整批改结果
- 对比功能：选择两篇作文对比分数变化
- 导出功能：导出批改记录（PDF/图片）

### 3.7 重批改功能

#### 3.7.1 功能描述
用户根据批改建议修改作文后，可再次提交批改，对比进步。

#### 3.7.2 用户流程
```
首次批改 → 查看结果 → 修改作文 → 再次提交 → AI对比批改 → 显示进步
```

#### 3.7.3 对比报告内容
- 分数变化（总分 + 各维度）
- 改进点总结
- 继续保持的优点
- 整体评价

---

## 4. 非功能需求

### 4.1 性能需求
| 指标 | 要求 |
|-----|------|
| 批改响应时间 | 异步处理，30秒内完成（90%请求） |
| OCR识别准确率 | 手写体≥85%，印刷体≥95%（GLM-OCR） |
| APP启动时间 | ≤3秒 |
| 页面加载时间 | ≤2秒 |

### 4.2 可用性需求
- 支持离线查看历史批改结果
- 支持横屏/竖屏模式
- 适配主流手机屏幕尺寸

### 4.3 安全需求
- 用户数据加密存储
- API调用频率限制
- 内容安全过滤（防止不当内容）

### 4.4 可扩展性需求
- 支持多语言扩展（后续支持中文作文）
- 支持多模型切换（GPT-4/Claude/文心等）

---

## 5. 技术架构设计

### 5.1 整体架构
```
┌─────────────────────────────────────────────────────────────────┐
│                         用户端层                                 │
│                    React Native / Flutter                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │  拍照模块  │   │  缓存模块  │   │  推送模块  │   │  统计模块  │    │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘    │
│       │              │              │              │            │
│       └──────────────┴──────────────┴──────────────┘            │
│                              │                                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        后端API层                                  │
│                      Node.js + Express                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ 认证服务  │   │  批改服务  │   │  用户服务  │   │  成就服务  │    │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘    │
│       │              │              │              │            │
│       └──────────────┴──────────────┴──────────────┘            │
│                              │                                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    数据库层     │    │    AI服务层      │    │    外部API层     │
│  PostgreSQL    │    │  LLM API调用    │    │  OCR + 推送     │
└───────────────┘    └─────────────────┘    └─────────────────┘
```

### 5.2 技术选型推荐

#### 5.2.1 前端：React Native vs Flutter

| 维度 | React Native | Flutter | 推荐 |
|-----|-------------|---------|------|
| **开发效率** | 热重载、JS生态 | 热重载、Dart生态 | 持平 |
| **性能** | 桥接层有开销 | 原生渲染，更流畅 | Flutter |
| **学习曲线** | React基础易上手 | Dart需学习 | React Native |
| **包体积** | 较小 | 较大 | React Native |
| **社区生态** | 成熟、插件多 | 增长中 | React Native |
| **跨平台** | iOS/Android | iOS/Android/Web | Flutter |

**推荐方案**：**React Native**
- 理由：团队更可能熟悉JavaScript/React生态
- 轻量化需求：包体积较小
- 生态成熟：遇到问题容易找到解决方案

**备选方案**：Flutter
- 理由：性能更优、渲染更流畅
- 适合：追求极致用户体验的场景

#### 5.2.2 后端：Node.js + Express

| 选项 | 优点 | 缺点 | 推荐度 |
|-----|------|-----|--------|
| **Node.js + Express** | 轻量、异步IO、与前端同语言 | 单线程CPU密集任务弱 | ★★★★★ |
| Python + FastAPI | AI集成方便、代码简洁 | 性能略低 | ★★★★ |
| Go | 高性能、部署简单 | 生态较新 | ★★★★ |
| Bun | 更快、现代化 | 太新、稳定存疑 | ★★★ |

**推荐方案**：**Node.js + Express**
- 理由：轻量化、与前端同语言降低学习成本
- 适合：IO密集型应用（API调用、数据库操作）

#### 5.2.3 数据库：PostgreSQL

| 选项 | 优点 | 缺点 | 推荐度 |
|-----|------|-----|--------|
| **PostgreSQL** | 功能强大、JSON支持、可靠 | 相对重 | ★★★★★ |
| MySQL | 成熟、稳定 | JSON支持弱 | ★★★★ |
| SQLite | 极轻量、嵌入式 | 不适合高并发 | ★★★ |
| MongoDB | 灵活、文档型 | 不适合复杂查询 | ★★★ |

**推荐方案**：**PostgreSQL**
- 理由：结构化数据存储、JSON字段支持灵活扩展
- 可选：使用Supabase/Neon等云PostgreSQL服务（轻量化托管）

#### 5.2.4 AI集成：LLM API

使用智谱AI GLM系列模型：

| 服务 | API格式 | 模型 | 优点 | 成本 |
|-----|--------|------|------|------|
| **智谱AI** | OpenAI兼容 | **glm-4.5-air** | 长文本处理强、中英文兼顾、统一API | 按量计费 |

**推荐方案**：**智谱AI GLM-4.5-air**

**API调用示例**：
```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_ZHIPU_API_KEY",  # 从智谱AI开放平台申请的API Key
    base_url="https://open.bigmodel.cn/api/paas/v4/",
)

completion = client.chat.completions.create(
    model="glm-4.5-air",
    messages=[
        {"role": "system", "content": "你是专业的英语作文批改助手。"},
        {"role": "user", "content": "请批改这篇英文作文..."}
    ],
    temperature=0.3,
)
```

**API调用架构**：
```
用户请求 → 后端队列 → 任务调度 → GLM-4.5-air → 结果解析 → 存储 → 推送通知
```

#### 5.2.5 OCR服务

使用字节跳动火山引擎 OCR：

| 服务 | 端点 | 模型 | 优点 | 成本 |
|-----|------|------|------|------|
| **火山引擎** | ark.cn-beijing.volces.com | ep-20251211154604-rz6zk | OpenAI SDK格式、响应快 | 按量计费 |

**推荐方案**：**字节跳动火山引擎 OCR**

**SDK调用示例**：
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key="YOUR_ARK_API_KEY",
)

response = client.responses.create(
    model="ep-20251211154604-rz6zk",
    input=[
        {
            "role": "user",
            "content": [
                {"type": "input_image", "image_url": "https://example.com/essay.jpg"},
                {"type": "input_text", "text": "请识别图片中的英文作文内容"},
            ],
        }
    ]
)

print(response.output_text)  # 识别出的文字
```

**图片预处理流程**：
1. 自动校正倾斜
2. 灰度增强
3. 区域裁剪（识别作文区域）
4. 提交火山引擎OCR识别

#### 5.2.6 认证方案

| 选项 | 优点 | 缺点 | 推荐度 |
|-----|------|-----|--------|
| **Firebase Auth** | 简单、免费额度够 | Google服务 | ★★★★★ |
| Supabase Auth | 与DB集成、免费 | 较新 | ★★★★ |
| 自建JWT | 完全控制 | 开发工作量大 | ★★★ |

**推荐方案**：**Firebase Authentication**
- 理由：支持手机号/邮箱/Google/Apple登录
- 免费额度足够小规模使用
- SDK集成简单

#### 5.2.7 推送通知

| 选项 | 优点 | 缺点 | 推荐度 |
|-----|------|-----|--------|
| **Firebase Cloud Messaging** | 免费、与Auth集成 | 需Google服务 | ★★★★★ |
| OneSignal | 免费、跨平台 | 较重 | ★★★★ |
| 极光推送 | 国内稳定 | 收费 | ★★★ |

**推荐方案**：**Firebase Cloud Messaging (FCM)**

#### 5.2.8 托管部署

| 选项 | 优点 | 缺点 | 推荐度 |
|-----|------|-----|--------|
| **Vercel** | 前端部署简单、免费 | 后端需配合 | ★★★★ |
| Railway | 简单、便宜 | 冷启动慢 | ★★★★ |
| Render | 完整托管 | 免费版有限制 | ★★★★ |
| Fly.io | 全球部署 | 配置复杂 | ★★★ |
| 阿里云/腾讯云 | 国内稳定 | 需配置 | ★★★ |

**推荐方案**：
- **前端**：Vercel（React Native Web可部署）
- **后端**：Railway / Render / Fly.io
- **数据库**：Neon (Serverless PostgreSQL) / Supabase

---

## 6. 完整技术栈总结

### 6.1 最终推荐方案

| 层级 | 技术选型 | 理由 |
|-----|---------|------|
| **移动端** | React Native | 轻量化、JS生态、跨平台 |
| **后端** | Node.js + Express | 轻量、异步IO、同语言 |
| **数据库** | PostgreSQL (Neon/Supabase) | 结构化数据、JSON支持 |
| **AI** | 智谱AI GLM-4.5-air | 长文本处理强、中英文兼顾 |
| **OCR** | 字节跳动火山引擎 | OpenAI SDK格式、响应快 |
| **认证** | Firebase Auth | 简单、免费额度够 |
| **推送** | Firebase Cloud Messaging | 免费、与Auth集成 |
| **部署** | Vercel + Railway | 轻量化、成本低 |

### 6.2 预估成本（初创阶段）

| 项目 | 月度成本预估 |
|-----|-------------|
| 智谱AI API (GLM-4.5-air) | ¥100-500（按调用量） |
| 字节OCR API | ¥50-200（按调用量） |
| Firebase（认证+推送） | ¥0（免费额度内） |
| Railway/Render | ¥50-150（基础实例） |
| Neon PostgreSQL | ¥0-100（Serverless） |
| 域名+SSL | ¥10-30 |
| **总计** | **¥210-980/月** |

---

## 7. 数据模型设计

### 7.1 核心实体关系
```
User (用户)
├── Rubrics (评分标准) 1:N
├── Essays (作文) 1:N
├── Achievements (成就) N:M
└── UserLevels (用户等级) 1:1

Essay (作文)
├── GradingResults (批改结果) 1:1
└── Versions (版本历史) 1:N

Rubric (评分标准)
└── Dimensions (评分维度) 1:N
```

### 7.2 完整数据模型
```typescript
// 用户表
interface User {
  id: string
  email?: string
  phone?: string
  displayName: string
  avatarUrl?: string
  role: 'student' | 'teacher'
  fcmToken?: string
  createdAt: Date
  updatedAt: Date
}

// 评分标准表
interface Rubric {
  id: string
  userId: string           // 创建者
  name: string
  description: string
  scene: 'exam' | 'practice' | 'custom'
  isDefault: boolean
  dimensions: RubricDimension[]
  status: 'draft' | 'active'
  createdAt: Date
  updatedAt: Date
}

// 作文表
interface Essay {
  id: string
  userId: string
  rubricId: string
  title?: string
  content: string
  source: 'text' | 'photo'   // 来源
  photoUrl?: string           // 原始图片URL
  status: 'pending' | 'graded' | 'failed'
  createdAt: Date
  updatedAt: Date
}

// 批改结果表
interface GradingResult {
  id: string
  essayId: string
  rubricId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  overallScore: number
  dimensionScores: DimensionScore[]
  strengths: string[]
  improvements: Improvement[]
  comments: SentenceComment[]
  overallFeedback: string
  aiModel: string
  processingTime: number
  createdAt: Date
}

// 用户成就表
interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  achievedAt: Date
}

// 成就定义表
interface Achievement {
  id: string
  name: string
  description: string
  type: 'beginner' | 'streak' | 'quality' | 'share'
  icon: string
  xpReward: number
  condition: {
    type: string
    threshold: number
  }
}

// 用户等级表
interface UserLevel {
  id: string
  userId: string
  currentLevel: number
  currentXP: number
  totalXP: number
  title: string
}
```

---

## 8. 开发阶段规划

### 阶段1：MVP最小可行产品（4-6周）

**目标**：验证核心批改功能

| 任务 | 类别 | 复杂度 | 依赖 |
|-----|------|-------|------|
| 项目初始化（RN + Node.js） | 全栈 | 低 | 无 |
| 用户认证（Firebase） | 后端 | 低 | 无 |
| 评分标准CRUD | 后端+前端 | 中 | 认证 |
| 作文提交 + 文本输入 | 前端 | 中 | 认证 |
| AI批改API集成 | 后端 | 中 | 评分标准 |
| 批改结果展示 | 前端 | 中 | 批改API |
| 批改历史列表 | 前端+后端 | 低 | 批改结果 |

### 阶段2：核心功能完善（4-6周）

**目标**：完善用户体验，添加拍照功能

| 任务 | 类别 | 复杂度 | 依赖 |
|-----|------|-------|------|
| 拍照上传 + OCR集成 | 全栈 | 高 | 阶段1 |
| 图片预处理 | 前端/后端 | 中 | 拍照上传 |
| 异步批改队列 | 后端 | 高 | 阶段1 |
| 推送通知集成 | 后端 | 中 | 异步批改 |
| 重批改对比功能 | 前端+后端 | 中 | 批改历史 |

### 阶段3：激励系统（3-4周）

**目标**：增加用户粘性

| 任务 | 类别 | 复杂度 | 依赖 |
|-----|------|-------|------|
| 成就系统设计 | 后端+前端 | 中 | 批改功能 |
| 等级系统 | 后端+前端 | 中 | 成就系统 |
| 成就/等级展示UI | 前端 | 低 | 等级系统 |
| 成就推送通知 | 后端 | 低 | 成就系统 |

### 阶段4：优化与发布（2-3周）

**目标**：性能优化，准备发布

| 任务 | 类别 | 复杂度 | 依赖 |
|-----|------|-------|------|
| 性能优化 | 全栈 | 中 | 全部 |
| 单元测试 | 测试 | 中 | 全部 |
| 广告集成 | 前端 | 中 | 阶段3 |
| App Store上架 | 流程 | 中 | 功能完成 |
| 监控告警 | 运维 | 低 | 部署 |

---

## 9. AI提示词设计

### 9.1 提示词A：生成评分标准建议

```markdown
你是一位专业的英语教学专家。请根据以下信息，为用户生成一份英文作文评分标准建议：

## 作文信息
- 场景类型：{scene}（中考/高考/雅思/托福/通用练习）
- 作文主题：{topic}（如：描述一次难忘的经历）
- 目标年级：{grade}（如：初三/高一）
- 作文长度：{length}（如：100-150 words）

## 要求
请生成以下内容：

1. **评分维度**（建议3-5个核心维度）：
   - 维度名称
   - 权重（百分比）
   - 分值范围（0-分值上限）
   - 评分要点描述
   - 各等级描述（优秀/良好/中等/及格/不及格）

2. **评分细则**：
   - 每个维度的具体评判标准
   - 扣分/加分点说明

3. **批改重点**：
   - 该场景作文需要特别关注的要点
   - 常见问题提醒

请以JSON格式输出，确保结构清晰可直接使用。
```

### 9.2 提示词B：批改作文

```markdown
你是一位资深的英语教师。请根据以下评分标准，对这篇英文作文进行批改。

## 评分标准
{rubric_json}
（包含各维度名称、权重、分值范围、评分要点）

## 作文信息
- 作文标题：{title}
- 原文内容：
{essay_content}

## 批改要求

请对作文进行详细批改，并严格按照以下JSON格式输出：

{
  "overallScore": 总分,
  "maxScore": 100,
  "dimensionScores": [
    {
      "dimensionName": "维度名称",
      "score": 得分,
      "maxScore": 最高分,
      "feedback": "该维度的具体评语（2-3句话）"
    }
  ],
  "strengths": ["优点1", "优点2", "优点3"],
  "improvements": [
    {
      "type": "grammar/vocabulary/structure/content",
      "original": "问题原文",
      "suggestion": "修改建议",
      "explanation": "修改原因说明",
      "lineNumber": 行号
    }
  ],
  "comments": [
    {
      "lineNumber": 行号,
      "originalText": "该行原文",
      "comment": "批注内容",
      "suggestion": "修改建议（可选）"
    }
  ],
  "overallFeedback": "综合评语（100-200字），包含整体评价和改进方向"
}

## 批改原则
1. 严格基于评分标准打分，客观公正
2. 优点和待改进点要具体明确
3. 改进建议要可操作
4. 评语要鼓励性为主，改进建议要建设性
```

### 9.3 提示词C：对比批改（修改前后）

```markdown
你是一位专业的英语教师。请对比这两篇作文（修改前 vs 修改后），分析学生的进步情况。

## 原始作文
{original_essay}

## 修改后作文
{revised_essay}

## 原始批改结果
{original_grading_result}

## 要求
请分析修改前后的变化，并以以下JSON格式输出：

{
  "scoreChange": {
    "overall": {
      "before": 原始总分,
      "after": 修改后总分,
      "difference": 分数变化
    },
    "dimensions": [
      {
        "dimensionName": "维度名称",
        "before": 原始分数,
        "after": 修改后分数,
        "change": 分数变化
      }
    ]
  },
  "improvements": [
    {
      "aspect": "改进方面（如：语法/词汇/结构）",
      "description": "具体改进说明",
      "example": {
        "before": "修改前示例",
        "after": "修改后示例"
      }
    }
  ],
  "maintainedStrengths": ["继续保持的优点"],
  "newSuggestions": ["新的改进建议（如有）"],
  "overallProgress": "整体进步评价（50-100字）"
}
```

---

## 10. 用户界面流程图

### 10.1 整体流程
```
                    ┌─────────────────┐
                    │    用户登录     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ 评分标准  │   │  新建作文  │   │  个人中心  │
       │   管理    │   │   提交    │   │   成就   │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            │              ▼              │
            │      ┌──────────────┐       │
            │      │  选择评分标准 │       │
            │      └──────┬───────┘       │
            │             │               │
            │    ┌────────┴────────┐      │
            │    ▼                 ▼      │
            │ ┌─────────┐    ┌─────────┐  │
            │ │ 拍照输入 │    │  文本输入 │  │
            │ └────┬────┘    └────┬────┘  │
            │      │               │       │
            │      └───────┬───────┘       │
            │              ▼               │
            │      ┌──────────────┐        │
            │      │  提交批改    │        │
            │      │  等待队列    │        │
            │      └──────┬───────┘        │
            │             │                │
            │      ┌──────┴──────┐         │
            │      ▼             ▼         │
            │  ┌────────┐   ┌────────┐    │
            │  │推送通知 │   │  手动刷新 │    │
            │  └────┬───┘   └────┬───┘    │
            │       │             │        │
            └───────┼─────────────┘        │
                    ▼                       │
            ┌──────────────┐                │
            │  查看批改结果 │                │
            │  详情/历史    │←───────────────┘
            └──────────────┘
```

---

## 11. 风险与应对

| 风险 | 影响 | 应对措施 |
|-----|------|---------|
| API Key泄露 | 账户被盗用、额度耗尽 | 使用环境变量、不写在代码中、定期更换 |
| GLM API不稳定 | 服务中断 | 队列重试、请求超时设置 |
| AI成本超支 | 运营成本高 | 限流、缓存、响应压缩 |
| OCR识别不准 | 用户体验差 | 人工校正入口、图片预处理优化 |
| 审核被拒 | 上线延迟 | 提前了解审核规则、内容过滤 |
| API限流 | 服务中断 | 队列削峰、请求优化 |
| 隐私问题 | 法律风险 | 数据加密、隐私政策 |

---

## 12. 后续迭代方向

| 优先级 | 功能 | 说明 |
|-------|------|------|
| P0 | 小程序版本 | 降低用户使用门槛 |
| P1 | 作文模板库 | 提供范文参考 |
| P1 | 多人协作批改 | 老师可分配作业 |
| P2 | 语音输入 | 解放双手 |
| P2 | AI写作助手 | 写作过程实时建议 |
| P3 | 社区功能 | 用户分享交流 |

---

## 13. 验收标准

### MVP验收清单

- [ ] 用户可注册/登录
- [ ] 用户可创建、编辑、删除评分标准
- [ ] 用户可提交英文作文（文本输入）
- [ ] AI可返回多维度批改结果（GLM-4.5-air）
- [ ] 用户可查看历史批改记录
- [ ] APP稳定运行，无崩溃

### 完整版验收清单

- [ ] 所有MVP功能完成
- [ ] 拍照OCR功能可用（字节火山引擎，准确率≥90%）
- [ ] 异步批改+推送通知正常
- [ ] 成就系统正常解锁
- [ ] 重批改对比功能正常
- [ ] 广告展示正常
- [ ] App Store/Google Play上架成功

---

*文档版本：v3.0*
*创建日期：2024年*
*最后更新：2025年2月3日*
*更新内容：OCR改为字节跳动火山引擎，AI保持智谱GLM-4.5-air*

**⚠️ 安全提醒**：请勿在代码或文档中硬编码API密钥，使用环境变量存储！
