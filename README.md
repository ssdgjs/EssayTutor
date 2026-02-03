# AsseyTutor - 智能英文作文批改APP

面向K12学生的智能英文作文批改工具，通过AI提供即时、详细的批改反馈。

## 技术栈

| 层级 | 技术选型 |
|-----|---------|
| **移动端** | React Native + Expo |
| **后端** | Node.js + Express + TypeScript |
| **数据库** | PostgreSQL |
| **AI** | 智谱AI GLM-4.5-air |
| **OCR** | 字节跳动火山引擎 |
| **状态管理** | Zustand |
| **API客户端** | Axios |

## 项目结构

```
asseytutor/
├── mobile/                 # React Native移动端
│   ├── src/
│   │   ├── app/           # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── services/      # API服务
│   │   ├── store/         # 状态管理
│   │   └── types/         # 类型定义
│   ├── package.json
│   └── app.json
│
├── server/                 # Node.js后端
│   ├── src/
│   │   ├── config/        # 配置
│   │   ├── middleware/    # 中间件
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── services/      # 业务服务
│   │   ├── utils/         # 工具函数
│   │   └── index.ts       # 入口
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                 # 共享类型
│   ├── src/
│   │   └── types/         # 类型定义
│   ├── package.json
│   └── tsconfig.json
│
├── package.json            # Workspace根配置
├── tsconfig.base.json      # TypeScript基础配置
├── .env.example            # 环境变量模板
└── .gitignore
```

## 快速开始

### 1. 安装依赖

```bash
# 安装所有依赖
npm install

# 或分别安装
npm install --workspaces
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
# 需要配置：
# - ZHIPU_API_KEY (智谱AI)
# - ARK_API_KEY (字节OCR)
# - DATABASE_URL (PostgreSQL)
```

### 3. 启动开发环境

```bash
# 启动后端
npm run dev:server

# 启动移动端
npm run dev:mobile

# 或同时启动
npm run dev
```

### 4. 移动端运行

```bash
# iOS
npm run dev:ios

# Android
npm run dev:android
```

## API接口

### AI批改
```
POST /api/ai/grade
Body: { essay: string, rubric?: object }
Response: { success: true, data: { result: string } }
```

### OCR识别
```
POST /api/ai/ocr
Body: { imageUrl: string }
Response: { success: true, data: { text: string } }
```

### 健康检查
```
GET /api/health
```

## 环境变量

| 变量 | 说明 | 必需 |
|-----|------|-----|
| ZHIPU_API_KEY | 智谱AI API Key | ✅ |
| ARK_API_KEY | 字节火山引擎API Key | ✅ |
| DATABASE_URL | PostgreSQL连接字符串 | ❌ (开发可选) |
| PORT | 服务端口 | ❌ (默认3001) |
| NODE_ENV | 运行环境 | ❌ (默认development) |

## 开发规范

### 代码风格
- TypeScript严格模式
- ESLint + Prettier
- 函数式组件 + Hooks

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

## 许可证

MIT
