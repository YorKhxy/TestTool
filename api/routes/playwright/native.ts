import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import { resolveProjectRoot } from './run.ts';

const router = Router();
let activeNativeRun: { runId: string; child: ChildProcess } | null = null;

type NativeRunSettings = {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number;
  baseURL?: string;
};

type StructuredNativeReportTest = {
  id: string;
  title: string;
  describePath: string[];
  steps?: string[];
  file?: string;
  project?: string;
  status: 'passed' | 'failed' | 'skipped' | 'flaky';
  durationMs: number;
  error?: string;
};

type StructuredNativeReport = {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    durationMs: number;
  };
  tests: StructuredNativeReportTest[];
};

export function sanitizeNativeSpecFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) {
    return 'native-spec.spec.js';
  }

  const baseName = path.basename(trimmed).replace(/[^\w.-]/g, '_');
  if (/\.(spec\.)?(ts|js)$/i.test(baseName)) {
    return baseName;
  }

  return `${baseName || 'native-spec'}.spec.js`;
}

export function buildNativePlaywrightEnv(baseEnv: NodeJS.ProcessEnv, baseURL?: string): NodeJS.ProcessEnv {
  const env = { ...baseEnv };
  const trimmedBaseURL = baseURL?.trim();
  if (trimmedBaseURL) {
    env.BASE_URL = trimmedBaseURL;
    env.ADMIN_BASE_URL = trimmedBaseURL;
    env.MERCHANT_BASE_URL = trimmedBaseURL;
  }
  return env;
}

function resolvePlaywrightCliPath(projectRoot: string): string {
  return path.join(projectRoot, 'node_modules', 'playwright', 'cli.js');
}

function findNearestExistingFile(startDir: string, candidates: string[]): string | null {
  let current = path.resolve(startDir);

  while (true) {
    for (const candidate of candidates) {
      const filePath = path.join(current, candidate);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function resolveExecutionContext(specFilePath: string, defaultProjectRoot: string): { cwd: string; cliPath: string } {
  const specDir = path.dirname(path.resolve(specFilePath));

  const playwrightConfigPath = findNearestExistingFile(specDir, [
    'playwright.config.ts',
    'playwright.config.js',
    'playwright.config.mjs',
    'playwright.config.cjs',
  ]);
  const packageJsonPath = findNearestExistingFile(specDir, ['package.json']);
  const executionCwd = playwrightConfigPath
    ? path.dirname(playwrightConfigPath)
    : (packageJsonPath ? path.dirname(packageJsonPath) : specDir);

  const localCliPath = findNearestExistingFile(executionCwd, ['node_modules/playwright/cli.js']);
  const cliPath = localCliPath || resolvePlaywrightCliPath(defaultProjectRoot);

  return {
    cwd: executionCwd,
    cliPath,
  };
}

function writeTempPlaywrightConfig(tempDir: string): string {
  const configPath = path.join(tempDir, 'playwright.config.cjs');
  const configContent = [
    'module.exports = {',
    "  testDir: '.',",
    "  testMatch: ['**/*.spec.js', '**/*.spec.ts', '**/*.js', '**/*.ts', '**/*.cjs', '**/*.mjs'],",
    '};',
    '',
  ].join('\n');
  fs.writeFileSync(configPath, configContent, 'utf8');
  return configPath;
}

function toPlaywrightTestTarget(specFilePath: string, cwd: string): string {
  const relative = path.relative(cwd, specFilePath);
  const normalized = (relative || path.basename(specFilePath)).replace(/\\/g, '/');
  if (normalized.startsWith('.') || normalized.startsWith('/')) {
    return normalized;
  }
  return `./${normalized}`;
}

function shouldTreatAsCommonJS(fileName: string, content: string): boolean {
  return fileName.toLowerCase().endsWith('.js') && /\brequire\s*\(/.test(content);
}

function getNativeRunDir(projectRoot: string, runId: string): string {
  return path.join(projectRoot, 'data', 'playwright-native', runId);
}

function getNativeReportPath(projectRoot: string, runId: string): string {
  return path.join(getNativeRunDir(projectRoot, runId), 'playwright-report.json');
}

function toStructuredStatus(outcome: unknown, finalResultStatus: unknown): 'passed' | 'failed' | 'skipped' | 'flaky' {
  if (outcome === 'flaky') return 'flaky';
  if (outcome === 'skipped' || finalResultStatus === 'skipped') return 'skipped';
  if (outcome === 'expected' || finalResultStatus === 'passed') return 'passed';
  return 'failed';
}

function flattenReporterStepTitles(steps: unknown, collector: string[]) {
  if (!Array.isArray(steps)) return;
  for (const item of steps) {
    if (!item || typeof item !== 'object') continue;
    const step = item as Record<string, unknown>;
    const title = typeof step.title === 'string' ? step.title.trim() : '';
    if (title) {
      collector.push(title);
    }
    flattenReporterStepTitles(step.steps, collector);
  }
}

function extractStepTitlesFromResults(results: Array<Record<string, unknown>>): string[] {
  const rawTitles: string[] = [];
  for (const result of results) {
    flattenReporterStepTitles(result.steps, rawTitles);
  }
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const title of rawTitles) {
    if (!seen.has(title)) {
      seen.add(title);
      unique.push(title);
    }
  }
  return unique;
}

function normalizeJsonReporter(raw: unknown): StructuredNativeReport {
  const report = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  const suites = Array.isArray(report.suites) ? report.suites : [];
  const tests: StructuredNativeReportTest[] = [];

  const walkSuite = (suite: Record<string, unknown>, describePath: string[]) => {
    const title = typeof suite.title === 'string' ? suite.title : '';
    const nextPath = title ? [...describePath, title] : describePath;

    const specs = Array.isArray(suite.specs) ? suite.specs : [];
    for (const spec of specs) {
      const specObj = (spec && typeof spec === 'object') ? (spec as Record<string, unknown>) : {};
      const specTitle = typeof specObj.title === 'string' ? specObj.title : '(unnamed test)';
      const specFile = typeof specObj.file === 'string' ? specObj.file : undefined;
      const specTests = Array.isArray(specObj.tests) ? specObj.tests : [];

      for (let i = 0; i < specTests.length; i++) {
        const testObj = (specTests[i] && typeof specTests[i] === 'object')
          ? (specTests[i] as Record<string, unknown>)
          : {};

        const results = Array.isArray(testObj.results) ? testObj.results as Array<Record<string, unknown>> : [];
        const lastResult = results.length > 0 ? results[results.length - 1] : undefined;
        const durationMs = typeof lastResult?.duration === 'number'
          ? lastResult.duration
          : results.reduce((acc, item) => acc + (typeof item.duration === 'number' ? item.duration : 0), 0);

        const errorText = lastResult?.error && typeof lastResult.error === 'object'
          ? (typeof (lastResult.error as Record<string, unknown>).message === 'string'
              ? (lastResult.error as Record<string, unknown>).message as string
              : JSON.stringify(lastResult.error))
          : undefined;

        tests.push({
          id: `${tests.length + 1}`,
          title: specTitle,
          describePath: nextPath,
          steps: extractStepTitlesFromResults(results),
          file: specFile,
          project: typeof testObj.projectName === 'string' ? testObj.projectName : undefined,
          status: toStructuredStatus(testObj.outcome, lastResult?.status),
          durationMs,
          error: errorText,
        });
      }
    }

    const childSuites = Array.isArray(suite.suites) ? suite.suites : [];
    for (const child of childSuites) {
      if (child && typeof child === 'object') {
        walkSuite(child as Record<string, unknown>, nextPath);
      }
    }
  };

  for (const suite of suites) {
    if (suite && typeof suite === 'object') {
      walkSuite(suite as Record<string, unknown>, []);
    }
  }

  const summary = {
    total: tests.length,
    passed: tests.filter((item) => item.status === 'passed').length,
    failed: tests.filter((item) => item.status === 'failed').length,
    skipped: tests.filter((item) => item.status === 'skipped').length,
    flaky: tests.filter((item) => item.status === 'flaky').length,
    durationMs: tests.reduce((acc, item) => acc + item.durationMs, 0),
  };

  return { summary, tests };
}

function readStructuredReport(reportPath: string): StructuredNativeReport | null {
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as unknown;
    return normalizeJsonReporter(raw);
  } catch {
    return null;
  }
}

router.post('/run', async (req: Request, res: Response) => {
  const { content, fileName, filePath, settings } = req.body as {
    content?: string;
    fileName?: string;
    filePath?: string;
    settings?: NativeRunSettings;
  };

  if (!filePath && (!content || !fileName)) {
    res.status(400).json({
      success: false,
      error: 'Missing filePath, or missing content/fileName.',
    });
    return;
  }

  const projectRoot = resolveProjectRoot();
  const runId = `native_${Date.now()}`;
  const runDir = getNativeRunDir(projectRoot, runId);
  const reportPath = getNativeReportPath(projectRoot, runId);
  const targetFilePath = filePath?.trim();
  const safeFileName = sanitizeNativeSpecFileName(targetFilePath ? path.basename(targetFilePath) : fileName!);
  const tempFilePath = path.join(runDir, safeFileName);
  let specFilePath = targetFilePath || tempFilePath;

  let executionContext = resolveExecutionContext(specFilePath, projectRoot);
  let configPath: string | null = null;

  try {
    if (activeNativeRun) {
      res.status(409).json({
        success: false,
        error: `Another native run is in progress: ${activeNativeRun.runId}`,
      });
      return;
    }

    fs.mkdirSync(runDir, { recursive: true });

    if (targetFilePath) {
      if (!fs.existsSync(targetFilePath)) {
        res.status(400).json({
          success: false,
          error: `File does not exist: ${targetFilePath}`,
        });
        return;
      }
    } else {
      let uploadFilePath = tempFilePath;
      if (shouldTreatAsCommonJS(safeFileName, content!)) {
        uploadFilePath = tempFilePath.replace(/\.js$/i, '.cjs');
      }
      fs.writeFileSync(uploadFilePath, content!, 'utf8');
      specFilePath = uploadFilePath;
      configPath = writeTempPlaywrightConfig(runDir);
      executionContext = {
        cwd: runDir,
        cliPath: resolvePlaywrightCliPath(projectRoot),
      };
    }

    if (!fs.existsSync(executionContext.cliPath)) {
      res.status(500).json({
        success: false,
        error: `Playwright CLI not found: ${executionContext.cliPath}`,
      });
      return;
    }

    const testTarget = toPlaywrightTestTarget(specFilePath, executionContext.cwd);

    const args = [
      executionContext.cliPath,
      'test',
      testTarget,
      '--reporter=line,json',
      '--workers=1',
      `--browser=${settings?.browser || 'chromium'}`,
      `--timeout=${settings?.timeout || 30000}`,
    ];

    if (settings?.headless === false) {
      args.push('--headed');
    }
    if (configPath) {
      args.push('--config', configPath);
    }

    const env = buildNativePlaywrightEnv(process.env, settings?.baseURL);
    env.PLAYWRIGHT_JSON_OUTPUT_NAME = reportPath;

    const child = spawn(process.execPath, args, {
      cwd: executionContext.cwd,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    activeNativeRun = { runId, child };

    let stdout = '';
    let stderr = '';
    const startedAt = Date.now();

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (activeNativeRun?.runId === runId) {
        activeNativeRun = null;
      }
      res.status(500).json({
        success: false,
        error: error.message,
      });
    });

    child.on('close', (code, signal) => {
      if (activeNativeRun?.runId === runId) {
        activeNativeRun = null;
      }
      const durationMs = Date.now() - startedAt;
      const report = readStructuredReport(reportPath);

      res.json({
        success: code === 0,
        data: {
          runId,
          fileName: safeFileName,
          tempFilePath: targetFilePath || tempFilePath,
          sourceFilePath: specFilePath,
          executionCwd: executionContext.cwd,
          cliPath: executionContext.cliPath,
          configPath,
          reportPath,
          report,
          exitCode: code ?? -1,
          signal: signal ?? null,
          durationMs,
          stdout,
          stderr,
        },
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Native spec run failed.',
    });
  }
});

router.post('/stop', (_req: Request, res: Response) => {
  if (!activeNativeRun) {
    res.status(404).json({
      success: false,
      error: 'No native run in progress.',
    });
    return;
  }

  const { runId, child } = activeNativeRun;
  try {
    child.kill('SIGTERM');

    setTimeout(() => {
      if (!child.killed) {
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore
        }
      }
    }, 1200);

    res.json({
      success: true,
      data: {
        runId,
        message: 'Stop signal sent.',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop native run.',
    });
  }
});

router.get('/report/:runId', (req: Request, res: Response) => {
  const runId = req.params.runId;
  if (!/^native_\d+$/.test(runId)) {
    res.status(400).json({
      success: false,
      error: 'Invalid runId.',
    });
    return;
  }

  const projectRoot = resolveProjectRoot();
  const reportPath = getNativeReportPath(projectRoot, runId);
  const report = readStructuredReport(reportPath);

  if (!report) {
    res.status(404).json({
      success: false,
      error: `Report not found: ${reportPath}`,
    });
    return;
  }

  res.json({
    success: true,
    data: {
      runId,
      reportPath,
      report,
    },
  });
});

router.get('/health', (_req: Request, res: Response) => {
  const projectRoot = resolveProjectRoot();
  const playwrightCliPath = resolvePlaywrightCliPath(projectRoot);

  res.json({
    success: true,
    data: {
      projectRoot,
      cliExists: fs.existsSync(playwrightCliPath),
      cliPath: playwrightCliPath,
      tempRoot: path.join(projectRoot, 'data', 'playwright-native'),
      platform: os.platform(),
    },
  });
});

export default router;
