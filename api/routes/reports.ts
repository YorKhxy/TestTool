import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { RunReport } from '../../shared/runTypes.js';

const router = Router();

function getReportsDir() {
  return path.resolve(process.cwd(), 'data', 'reports');
}

async function listReportFiles() {
  try {
    const files = await fs.readdir(getReportsDir());
    return files.filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
}

router.get('/', async (_req: Request, res: Response) => {
  const files = await listReportFiles();
  const items: { runId: string; startedAt?: string; finishedAt?: string; total?: number; passed?: number; failed?: number; durationMs?: number }[] = [];

  for (const f of files.slice().sort().reverse().slice(0, 100)) {
    try {
      const raw = await fs.readFile(path.join(getReportsDir(), f), 'utf-8');
      const json = JSON.parse(raw) as RunReport;
      const s = json.summary;
      items.push({
        runId: s.runId,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        total: s.total,
        passed: s.passed,
        failed: s.failed,
        durationMs: s.durationMs,
      });
    } catch {
      continue;
    }
  }

  res.json({ success: true, data: items });
});

router.get('/:runId', async (req: Request, res: Response) => {
  const runId = req.params.runId;
  if (!runId) {
    res.status(400).json({ success: false, error: 'runId 不能为空' });
    return;
  }
  const filePath = path.join(getReportsDir(), `${runId}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(raw) as RunReport;
    res.json({ success: true, data: json });
  } catch {
    res.status(404).json({ success: false, error: '报告不存在' });
  }
});

export default router;
