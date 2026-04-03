import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { RunConfig } from '../../shared/runTypes.js';

const router = Router();

type SavedSettings = {
  baseUrl: string;
  timeoutMs: number;
  concurrency: number;
  continueOnFail: boolean;
  auth?: { email: string; password: string; mfaCode?: string };
};

function getDataDir() {
  return path.resolve(process.cwd(), 'data');
}

function getSettingsPath() {
  return path.join(getDataDir(), 'settings.json');
}

async function ensureDataDir() {
  await fs.mkdir(getDataDir(), { recursive: true });
}

function normalizeSettings(input: Partial<RunConfig> | null | undefined): SavedSettings {
  const baseUrl = typeof input?.baseUrl === 'string' ? input.baseUrl.replace(/`/g, '').trim() : '';
  const timeoutMs = typeof input?.timeoutMs === 'number' && Number.isFinite(input.timeoutMs) ? input.timeoutMs : 15000;
  const concurrency = typeof input?.concurrency === 'number' && Number.isFinite(input.concurrency) ? input.concurrency : 1;
  const continueOnFail = typeof input?.continueOnFail === 'boolean' ? input.continueOnFail : true;
  const auth = input?.auth;

  const normalized: SavedSettings = {
    baseUrl,
    timeoutMs: Math.max(1000, Math.floor(timeoutMs)),
    concurrency: Math.max(1, Math.min(10, Math.floor(concurrency))),
    continueOnFail,
  };

  if (auth && typeof auth.email === 'string' && typeof auth.password === 'string') {
    normalized.auth = {
      email: auth.email,
      password: auth.password,
      mfaCode: typeof auth.mfaCode === 'string' ? auth.mfaCode : undefined,
    };
  }
  return normalized;
}

async function readSettings(): Promise<SavedSettings | null> {
  try {
    const raw = await fs.readFile(getSettingsPath(), 'utf-8');
    const json = JSON.parse(raw) as SavedSettings;
    return normalizeSettings(json);
  } catch {
    return null;
  }
}

router.get('/', async (_req: Request, res: Response) => {
  const s = (await readSettings()) ?? normalizeSettings(null);
  res.json({ success: true, data: s });
});

router.put('/', async (req: Request, res: Response) => {
  const normalized = normalizeSettings(req.body);
  if (!normalized.baseUrl) {
    res.status(400).json({ success: false, error: 'baseUrl 不能为空' });
    return;
  }
  await ensureDataDir();
  await fs.writeFile(getSettingsPath(), JSON.stringify(normalized, null, 2), 'utf-8');
  res.json({ success: true, data: normalized });
});

export default router;

