import dotenv from 'dotenv';
import path from 'path';

// Try multiple paths for .env file
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    envLoaded = true;
    console.log(`✅ Loaded .env from: ${envPath}`);
    break;
  }
}

if (!envLoaded) {
  console.log('⚠️ No .env file found, using environment variables');
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  zhipu: {
    apiKey: process.env.ZHIPU_API_KEY || '',
    baseUrl: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    model: process.env.GLM_MODEL || 'glm-4.5-air',
  },
  
  ark: {
    apiKey: process.env.ARK_API_KEY || '',
    baseUrl: process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    model: process.env.ARK_MODEL || 'ep-20251211154604-rz6zk',
  },
};
