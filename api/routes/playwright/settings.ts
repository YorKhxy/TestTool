import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import type { PlaywrightConfig } from '../../shared/playwrightCase.js';

const router = Router();

const defaultSettings: PlaywrightConfig = {
  browser: 'chromium',
  viewport: { width: 1920, height: 1080 },
  slowMo: 0,
  timeout: 30000,
  screenshotOnFailure: true,
  recordVideo: false,
  baseURL: 'http://localhost:3000',
};

function getSettingsFilePath(): string {
  const dataDir = path.join(process.cwd(), 'data');
  return path.join(dataDir, 'playwright_settings.json');
}

function loadSettings(): PlaywrightConfig {
  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch {
  }
  return defaultSettings;
}

function saveSettings(settings: PlaywrightConfig): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = getSettingsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

router.get('/', (_req: Request, res: Response) => {
  const settings = loadSettings();
  res.json({
    success: true,
    data: settings,
  });
});

router.post('/', (req: Request, res: Response) => {
  try {
    const settings: PlaywrightConfig = req.body;
    const normalized = {
      ...defaultSettings,
      ...settings,
    };
    saveSettings(normalized);
    res.json({
      success: true,
      data: normalized,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '保存设置失败',
    });
  }
});

export default router;
