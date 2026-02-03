import { Router } from 'express';
import aiRoutes from './ai.routes';
import authRoutes from './auth.routes';
import rubricsRoutes from './rubrics.routes';
import essaysRoutes from './essays.routes';
import achievementsRoutes from './achievements.routes';

const router = Router();

router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);
router.use('/rubrics', rubricsRoutes);
router.use('/essays', essaysRoutes);
router.use('/achievements', achievementsRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
