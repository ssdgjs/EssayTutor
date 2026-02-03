import OpenAI from 'openai';
import { config } from '../config';

export const zhipuClient = new OpenAI({
  apiKey: config.zhipu.apiKey,
  baseURL: config.zhipu.baseUrl,
  timeout: 60000, // 60秒超时
  maxRetries: 2,
});

export const arkClient = new OpenAI({
  apiKey: config.ark.apiKey,
  baseURL: config.ark.baseUrl,
  timeout: 60000,
  maxRetries: 2,
});

// AI服务封装 - 强制返回标准JSON格式
export async function gradeEssay(essay: string, rubric: object, customPrompt?: string): Promise<string> {
  console.log(`[AI] 开始调用智谱API，模型: ${config.zhipu.model}`);
  console.log(`[AI] 作文长度: ${essay.length} 字符`);

  const startTime = Date.now();

  // 构建系统提示词
  let systemPrompt = `You are an English essay grading assistant. You MUST respond with ONLY valid JSON, no markdown formatting.

Required JSON format (exactly this structure):
{
  "overallScore": 分数(0-100),
  "dimensionScores": [
    {"name": "内容/Content", "score": 分数, "maxScore": 满分, "feedback": "简短评语"}
  ],
  "strengths": ["优点1", "优点2"],
  "improvements": [
    {"type": "grammar/vocabulary/structure/content", "original": "原文片段", "suggestion": "修改建议"}
  ],
  "overallFeedback": "综合评语(50-100字)"
}`;

  // 如果用户提供了自定义提示词，追加到系统提示词中
  if (customPrompt && customPrompt.trim()) {
    systemPrompt = `${systemPrompt}

${customPrompt.trim()}`;
    console.log(`[AI] 已合并自定义提示词`);
  }

  try {
    const response = await zhipuClient.chat.completions.create({
      model: config.zhipu.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Grade this English essay. Reply with ONLY the JSON object.

Essay:
${essay}

Rubric:
${JSON.stringify(rubric || {}, null, 2)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[AI] API调用成功，耗时: ${elapsed}ms`);

    let content = response.choices[0]?.message?.content || '';

    // 确保返回纯JSON，移除markdown标记
    content = content.replace(/```json?/g, '').replace(/```/g, '').trim();

    // 验证是有效JSON
    try {
      JSON.parse(content);
      console.log(`[AI] JSON验证通过`);
    } catch (e) {
      console.warn(`[AI] 返回的不是标准JSON，将尝试解析`);
    }

    return content;
  } catch (error: any) {
    console.error(`[AI] API调用失败:`, error.message);
    throw error;
  }
}

// OCR服务封装
export async function recognizeText(imageUrl: string): Promise<string> {
  console.log(`[OCR] 开始调用火山引擎OCR`);
  
  try {
    const response = await arkClient.chat.completions.create({
      model: config.ark.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: 'Extract text from this image' }
          ]
        }
      ],
      max_tokens: 3000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error(`[OCR] API调用失败:`, error.message);
    throw error;
  }
}
