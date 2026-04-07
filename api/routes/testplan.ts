import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
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

router.post('/save', async (req: Request, res: Response) => {
  const { filePath, markdown } = req.body as { filePath?: string; markdown?: string };

  if (!filePath || typeof filePath !== 'string') {
    res.status(400).json({ success: false, error: '文件路径无效' });
    return;
  }

  if (!markdown || typeof markdown !== 'string') {
    res.status(400).json({ success: false, error: 'markdown 内容无效' });
    return;
  }

  try {
    const resolvedPath = path.resolve(filePath);
    await fs.writeFile(resolvedPath, markdown, 'utf-8');
    res.json({ success: true, path: resolvedPath });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '保存失败';
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;

