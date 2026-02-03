import { Router, Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../middleware/response';
import { gradeEssay, recognizeText } from '../services/ai.service';

const router = Router();

// POST /api/ai/grade - 批改作文
router.post('/grade', asyncHandler(async (req: Request, res: Response) => {
  const { essay, rubric, customPrompt } = req.body;

  if (!essay) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_CONTENT', message: 'Essay content is required' }
    });
  }

  const result = await gradeEssay(essay, rubric || {}, customPrompt);
  sendSuccess(res, { result });
}));

// POST /api/ai/ocr - OCR识别
router.post('/ocr', asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_URL', message: 'Image URL is required' }
    });
  }
  
  const text = await recognizeText(imageUrl);
  sendSuccess(res, { text });
}));

export default router;
