import { Router, type Request, type Response } from 'express';
import { parseTestPlanMarkdown } from '../../shared/testPlan.js';

const router = Router();

router.post('/parse', (req: Request, res: Response) => {
  const markdown = typeof req.body?.markdown === 'string' ? req.body.markdown : '';
  if (!markdown.trim()) {
    res.status(400).json({ success: false, error: 'markdown 不能为空' });
    return;
  }
  const parsed = parseTestPlanMarkdown(markdown);
  res.json({ success: true, data: parsed });
});

export default router;

