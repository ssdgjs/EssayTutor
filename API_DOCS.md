# AsseyTutor API 文档

**版本:** 1.0.0  
**最后更新:** 2026-02-03

---

## 基础信息

- **Base URL:** `http://localhost:3001/api`
- **Content-Type:** `application/json`
- **认证:** Bearer Token

---

## 认证相关

### POST /auth/register
注册新用户

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "Secure123!",
  "displayName": "Test User"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Test User",
      "role": "student"
    },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### POST /auth/login
用户登录

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "Secure123!"
}
```

### GET /auth/me
获取当前用户信息

**Headers:**
```
Authorization: Bearer <token>
```

---

## 评分标准 (Rubrics)

### GET /rubrics
获取评分标准列表

**查询参数:**
- `page` - 页码 (默认: 1)
- `limit` - 每页数量 (默认: 10)
- `search` - 搜索关键词

### POST /rubrics
创建评分标准

**请求体:**
```json
{
  "name": "中考英语作文评分标准",
  "description": "适用于初中英语作文批改",
  "scene": "exam",
  "dimensions": [
    {
      "name": "内容",
      "description": "主题相关性、论点清晰度",
      "weight": 0.3,
      "maxScore": 30,
      "criteria": "内容充实，论点清晰",
      "levels": [
        { "score": 27, "description": "优秀" }
      ]
    }
  ]
}
```

### PUT /rubrics/:id
更新评分标准

### DELETE /rubrics/:id
删除评分标准

### POST /rubrics/suggest
获取AI建议的评分标准

---

## 作文批改 (Essays)

### GET /essays
获取作文历史列表

**查询参数:**
- `page` - 页码
- `limit` - 每页数量
- `status` - 状态过滤 (pending, graded)
- `sortBy` - 排序字段 (createdAt, updatedAt)
- `order` - 排序方向 (asc, desc)

### POST /essays
提交作文批改

**请求体:**
```json
{
  "rubricId": "rubric-uuid",
  "title": "My Essay",
  "content": "Essay content here...",
  "source": "text"
}
```

### GET /essays/:id
获取作文详情

### GET /essays/:id/result
获取批改结果

**响应:**
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "maxScore": 100,
    "dimensionScores": [
      {
        "dimensionName": "内容",
        "score": 27,
        "maxScore": 30,
        "feedback": "内容充实，论述清晰"
      }
    ],
    "strengths": ["优点1", "优点2"],
    "improvements": [
      {
        "type": "grammar",
        "original": "错误句子",
        "suggestion": "修改建议",
        "explanation": "原因说明"
      }
    ],
    "overallFeedback": "综合评语"
  }
}
```

### POST /essays/:id/regrade
重新批改（创建新版本）

### GET /essays/:id/compare
对比不同版本

---

## 成就系统 (Achievements)

### GET /achievements
获取所有成就定义

### GET /achievements/user
获取用户已解锁成就

### GET /achievements/progress
获取成就进度

### POST /achievements/check
检查并解锁成就

### GET /achievements/level
获取用户等级

**响应:**
```json
{
  "success": true,
  "data": {
    "currentLevel": 2,
    "currentXP": 150,
    "totalXP": 350,
    "title": "写作入门",
    "xpToNextLevel": 350
  }
}
```

---

## AI 批改 (AI)

### POST /ai/grade
AI作文批改

**请求体:**
```json
{
  "essay": "Essay content...",
  "rubric": {
    "dimensions": [...]
  }
}
```

### POST /ai/ocr
OCR文字识别

**请求体:**
```json
{
  "imageUrl": "https://example.com/essay.jpg"
}
```

---

## 错误代码

| 代码 | 描述 |
|------|------|
| `INVALID_EMAIL` | 邮箱格式错误 |
| `WEAK_PASSWORD` | 密码强度不足 |
| `EMAIL_EXISTS` | 邮箱已注册 |
| `INVALID_CREDENTIALS` | 登录凭据错误 |
| `UNAUTHORIZED` | 未授权 |
| `NOT_FOUND` | 资源不存在 |
| `FORBIDDEN` | 无权限访问 |
| `VALIDATION_ERROR` | 参数验证错误 |
| `INVALID_WEIGHTS` | 评分权重总和不为1 |
| `CANNOT_DELETE_DEFAULT` | 无法删除默认评分标准 |
| `NOT_GRADED` | 作文尚未批改 |

---

## 数据模型

### User (用户)
- `id`: UUID
- `email`: 邮箱
- `displayName`: 显示名称
- `role`: 角色 (student, teacher)
- `createdAt`: 创建时间

### Rubric (评分标准)
- `id`: UUID
- `name`: 名称
- `description`: 描述
- `scene`: 场景 (exam, practice, custom)
- `dimensions`: 评分维度 (JSON)
- `isDefault`: 是否默认
- `userId`: 创建者ID

### Essay (作文)
- `id`: UUID
- `title`: 标题
- `content`: 内容
- `source`: 来源 (text, photo)
- `status`: 状态 (pending, graded)
- `rubricId`: 评分标准ID
- `userId`: 用户ID

### GradingResult (批改结果)
- `id`: UUID
- `essayId`: 作文ID
- `overallScore`: 总分
- `dimensionScores`: 维度分数 (JSON)
- `strengths`: 优点 (JSON)
- `improvements`: 改进建议 (JSON)
- `overallFeedback`: 综合评语

### Achievement (成就)
- `id`: UUID
- `name`: 名称
- `description`: 描述
- `type`: 类型 (beginner, streak, quality)
- `xpReward`: XP奖励
- `condition`: 解锁条件 (JSON)

---

**文档版本:** 1.0.0
