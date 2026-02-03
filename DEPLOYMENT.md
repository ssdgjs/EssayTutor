# AsseyTutor 部署指南

## 🚀 快速部署到 Railway

### 前置要求

1. [Railway 账号](https://railway.app/) (免费额度足够测试)
2. 智谱AI API Key
3. 字节跳动火山引擎 API Key

### 步骤 1: 获取 API Keys

#### 智谱AI (GLM-4.5-air)
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入控制台 → API Key
4. 创建新的 API Key

#### 字节跳动火山引擎 (OCR)
1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 开通 OCR 服务
3. 获取 API Key

### 步骤 2: 部署到 Railway

#### 方式 1: 通过 Railway CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录 Railway
railway login

# 初始化项目
railway init

# 添加 PostgreSQL 数据库
railway add postgresql

# 添加环境变量 (替换为真实值)
railway variables set ZHIPU_API_KEY=your-zhipu-api-key
railway variables set ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
railway variables set GLM_MODEL=glm-4.5-air
railway variables set ARK_API_KEY=your-ark-api-key
railway variables set ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
railway variables set ARK_MODEL=ep-20251211154604-rz6zk
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# 部署
railway up
```

#### 方式 2: 通过 Railway 网页界面

1. 登录 [Railway](https://railway.app/)
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择你的仓库
4. Railway 会自动检测并配置

**设置环境变量：**

在 Railway 项目设置中添加以下变量：

```
NODE_ENV=production
PORT=3001
JWT_SECRET=<生成一个随机字符串>
DATABASE_URL=<Railway 自动提供>
ZHIPU_API_KEY=<你的智谱AI API Key>
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
GLM_MODEL=glm-4.5-air
ARK_API_KEY=<你的火山引擎 API Key>
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_MODEL=ep-20251211154604-rz6zk
```

### 步骤 3: 配置数据库

Railway 会自动创建 PostgreSQL 数据库。需要执行迁移：

```bash
# 在 Railway 项目中打开 Console
railway open

# 或通过网页界面打开项目 Console

# 执行数据库迁移
npx prisma migrate deploy
```

### 步骤 4: 获取 API URL

部署成功后，Railway 会提供一个公网 URL，格式如：
```
https://your-project.railway.app
```

### 步骤 5: 更新移动端配置

在 `mobile/src/services/api.ts` 中更新 API URL：

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-project.railway.app';
```

---

## 📱 运行移动端 (Expo)

### 在手机上运行

1. 安装 [Expo Go](https://expo.dev/go) App (iOS/Android)
2. 启动开发服务器：
   ```bash
   npm run dev:mobile
   ```
3. 用 Expo Go 扫描二维码

### 构建生产版本

```bash
# Android
eas build --platform android

# iOS (需要 Mac)
eas build --platform ios
```

---

## 🧪 测试部署

### 测试后端 API

```bash
# 健康检查
curl https://your-project.railway.app/api/health

# 用户注册
curl -X POST https://your-project.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'
```

### 使用 Python 测试脚本

```bash
# 更新 API URL
export API_URL=https://your-project.railway.app

# 运行测试
python test_api.py
```

---

## 🔧 故障排查

### 数据库连接失败

```bash
# 检查 Railway 提供的 DATABASE_URL
railway variables get DATABASE_URL

# 重新执行迁移
npx prisma migrate reset --force
```

### API Key 无效

1. 检查 API Key 是否正确
2. 确认 API Key 有足够配额
3. 查看日志：`railway logs`

### 端口配置

确保 Railway 项目中设置了正确的 `PORT=3001`

---

## 📊 监控和日志

在 Railway 项目页面可以查看：
- 实时日志
- 资源使用情况
- 部署历史
- 数据库连接

---

## 🔄 持续部署

推送代码到 GitHub 后，Railway 会自动重新部署。

---

## 💰 成本

- Railway 免费额度：$5/月
- 超出后按使用量计费
- 测试阶段免费额度足够

---

## 📞 支持

- Railway 文档: https://docs.railway.app/
- Prisma 文档: https://www.prisma.io/docs
- Expo 文档: https://docs.expo.dev/
