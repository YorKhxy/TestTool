import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { chromium, type Browser, type Page } from '@playwright/test';
import type {
  PlaywrightCase,
  PlaywrightConfig,
  PlaywrightExecutionLog,
  CaseExecutionLog,
  StepExecutionLog,
} from '../../shared/playwrightCase.js';

const router = Router();

let currentBrowser: Browser | null = null;
let isCancelled = false;
let currentRunId: string | null = null;

type ProgressEvent = {
  type: 'case_start' | 'case_end' | 'step_start' | 'step_end' | 'complete' | 'error';
  runId: string;
  caseId?: string;
  caseTitle?: string;
  stepId?: string;
  stepIndex?: number;
  stepType?: string;
  stepDescription?: string;
  status?: 'passed' | 'failed' | 'running' | 'pending';
  error?: string;
  caseStatus?: 'passed' | 'failed' | 'running' | 'canceled' | 'skipped';
  data?: Partial<CaseExecutionLog> | Partial<StepExecutionLog>;
};

type SSEClient = {
  id: string;
  res: Response;
};

const sseClients: Map<string, SSEClient> = new Map();

function sendSSEEvent(event: ProgressEvent) {
  const data = JSON.stringify(event);
  sseClients.forEach((client) => {
    try {
      client.res.write(`event: progress\ndata: ${data}\n\n`);
    } catch {
      sseClients.delete(client.id);
    }
  });
}

router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  sseClients.set(clientId, { id: clientId, res });

  console.log(`SSE client connected: ${clientId}. Total clients: ${sseClients.size}`);

  req.on('close', () => {
    sseClients.delete(clientId);
    console.log(`SSE client disconnected: ${clientId}. Total clients: ${sseClients.size}`);
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);
});

function getLogsStorage(): PlaywrightExecutionLog[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'playwright_logs.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {
  }
  return [];
}

function saveLogsStorage(logs: PlaywrightExecutionLog[]): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, 'playwright_logs.json');
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Failed to save logs:', e);
  }
}

async function executeStep(
  page: Page,
  step: PlaywrightCase['steps'][0],
  baseURL: string,
  stepLog: StepExecutionLog
): Promise<{ passed: boolean; error?: string }> {
  const startedAt = new Date().toISOString();
  stepLog.startedAt = startedAt;

  try {
    switch (step.type.toLowerCase()) {
      case 'navigate': {
        const path = step.value || '/';
        const url = path.startsWith('http') ? path : `${baseURL}${path}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        break;
      }

      case 'click':
        if (step.selector) {
          await page.click(step.selector);
        }
        break;

      case 'fill':
      case 'type':
        if (step.selector && step.value) {
          await page.fill(step.selector, step.value);
        }
        break;

      case 'select':
        if (step.selector && step.value) {
          await page.selectOption(step.selector, step.value);
        }
        break;

      case 'check':
        if (step.selector) {
          await page.check(step.selector);
        }
        break;

      case 'uncheck':
        if (step.selector) {
          await page.uncheck(step.selector);
        }
        break;

      case 'hover':
        if (step.selector) {
          await page.hover(step.selector);
        }
        break;

      case 'screenshot':
        await page.screenshot();
        break;

      case 'waitfor':
      case 'waitforselector':
        if (step.selector) {
          await page.waitForSelector(step.selector, { timeout: step.options?.timeout || 5000 });
        }
        break;

      case 'wait':
        await page.waitForTimeout(parseInt(step.value || '1000', 10));
        break;

      case 'assert':
      case 'expect':
        if (step.selector) {
          const element = page.locator(step.selector);
          const isVisible = await element.isVisible();
          if (step.options?.expected) {
            if (step.options.operator === 'contains') {
              const text = await element.textContent();
              if (!text?.includes(step.options.expected)) {
                throw new Error(`预期包含 "${step.options.expected}"，实际为 "${text}"`);
              }
            } else if (step.options.operator === 'equals') {
              const text = await element.textContent();
              if (text !== step.options.expected) {
                throw new Error(`预期等于 "${step.options.expected}"，实际为 "${text}"`);
              }
            } else if (step.options.operator === 'exists') {
              if (!isVisible) {
                throw new Error(`预期元素存在，实际不存在`);
              }
            }
          } else {
            if (!isVisible) {
              throw new Error(`预期元素可见，实际不可见`);
            }
          }
        }
        break;

      case 'evaluate':
        if (step.value) {
          await page.evaluate(step.value);
        }
        break;

      default:
        throw new Error(`不支持的步骤类型: ${step.type}`);
    }

    stepLog.status = 'passed';
    stepLog.finishedAt = new Date().toISOString();
    stepLog.durationMs = new Date(stepLog.finishedAt).getTime() - new Date(startedAt).getTime();
    return { passed: true };
  } catch (error) {
    stepLog.status = 'failed';
    stepLog.error = error instanceof Error ? error.message : String(error);
    stepLog.finishedAt = new Date().toISOString();
    stepLog.durationMs = new Date(stepLog.finishedAt).getTime() - new Date(startedAt).getTime();
    return { passed: false, error: stepLog.error };
  }
}

router.post('/', async (req: Request, res: Response) => {
  currentBrowser = null;
  isCancelled = false;
  currentRunId = null;

  try {
    const { cases, settings } = req.body;

    console.log('[RUN] Received request with', cases?.length, 'cases');
    console.log('[RUN] Cases:', JSON.stringify(cases?.slice(0, 1), null, 2));

    if (!cases || !Array.isArray(cases)) {
      res.status(400).json({
        success: false,
        error: '缺少 cases 参数',
      });
      return;
    }

    const runId = `run_${Date.now()}`;
    currentRunId = runId;
    console.log('[RUN] RunId:', runId);
    const startedAt = new Date().toISOString();

    const config: PlaywrightConfig = settings || {
      browser: 'chromium',
      viewport: { width: 1920, height: 1080 },
      slowMo: 0,
      timeout: 30000,
      screenshotOnFailure: true,
      recordVideo: false,
      baseURL: 'http://localhost:3000',
    };

    const baseURL = settings?.useCaseUrl
      ? (cases[0]?.url || config.baseURL || 'http://localhost:3000')
      : (config.baseURL || 'http://localhost:3000');

    const executionLog: PlaywrightExecutionLog = {
      id: runId,
      runId,
      suiteName: 'Playwright Test Suite',
      startedAt,
      totalCases: cases.length,
      passedCases: 0,
      failedCases: 0,
      skippedCases: 0,
      canceledCases: 0,
      caseLogs: [],
      config,
      baseURL,
    };

    currentBrowser = await chromium.launch({
      headless: true,
      slowMo: config.slowMo || 0,
    });

    const context = await currentBrowser.newContext({
      viewport: config.viewport || { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    sendSSEEvent({
      type: 'case_start',
      runId,
      caseId: 'init',
      caseTitle: '初始化...',
      status: 'running',
    });

    for (const testCase of cases) {
      if (isCancelled) {
        const remainingCases = cases.indexOf(testCase);
        executionLog.canceledCases = remainingCases;
        break;
      }

      const caseStartedAt = new Date().toISOString();
      const caseLog: CaseExecutionLog = {
        caseId: testCase.id,
        caseTitle: testCase.title,
        caseGroup: testCase.group,
        priority: testCase.priority,
        status: 'running',
        startedAt: caseStartedAt,
        stepLogs: [],
        totalSteps: testCase.steps?.length || 0,
        passedSteps: 0,
        failedSteps: 0,
      };

      executionLog.caseLogs.push(caseLog);

      sendSSEEvent({
        type: 'case_start',
        runId,
        caseId: testCase.id,
        caseTitle: testCase.title,
        status: 'running',
      });

      const caseBaseURL = testCase.url || baseURL;
      console.log(`[RUN] Case "${testCase.title}" using baseURL: ${caseBaseURL}`);

      for (let i = 0; i < (testCase.steps?.length || 0); i++) {
        if (isCancelled) {
          break;
        }
        const step = testCase.steps[i];
        console.log(`[RUN] Executing step ${i}: type=${step.type}, selector=${step.selector}, value=${step.value}`);

        const stepLog: StepExecutionLog = {
          stepId: step.id || `step_${i}`,
          stepIndex: i,
          stepType: step.type,
          description: step.description || `Step ${i + 1}`,
          status: 'running',
          startedAt: new Date().toISOString(),
        };
        caseLog.stepLogs.push(stepLog);

        sendSSEEvent({
          type: 'step_start',
          runId,
          caseId: testCase.id,
          stepId: stepLog.stepId,
          stepIndex: i,
          stepType: step.type,
          stepDescription: stepLog.description,
          status: 'running',
        });

        const result = await executeStep(page, step, caseBaseURL, stepLog);

        if (result.passed) {
          caseLog.passedSteps++;
          stepLog.status = 'passed';
          sendSSEEvent({
            type: 'step_end',
            runId,
            caseId: testCase.id,
            stepId: stepLog.stepId,
            stepIndex: i,
            status: 'passed',
            data: { status: 'passed', durationMs: stepLog.durationMs },
          });
        } else {
          caseLog.failedSteps++;
          caseLog.status = 'failed';
          stepLog.status = 'failed';
          stepLog.error = result.error;
          sendSSEEvent({
            type: 'step_end',
            runId,
            caseId: testCase.id,
            stepId: stepLog.stepId,
            stepIndex: i,
            status: 'failed',
            error: result.error,
            data: { status: 'failed', error: result.error, durationMs: stepLog.durationMs },
          });
        }
      }

      if (isCancelled) {
        caseLog.status = 'canceled';
        executionLog.canceledCases++;
        sendSSEEvent({
          type: 'case_end',
          runId,
          caseId: testCase.id,
          caseStatus: 'canceled',
        });
      } else if (caseLog.failedSteps === 0 && caseLog.totalSteps > 0) {
        caseLog.status = 'passed';
        executionLog.passedCases++;
        sendSSEEvent({
          type: 'case_end',
          runId,
          caseId: testCase.id,
          caseStatus: 'passed',
          data: { status: 'passed', passedSteps: caseLog.passedSteps, failedSteps: 0 },
        });
      } else if (caseLog.failedSteps > 0) {
        caseLog.status = 'failed';
        executionLog.failedCases++;
        sendSSEEvent({
          type: 'case_end',
          runId,
          caseId: testCase.id,
          caseStatus: 'failed',
          data: { status: 'failed', passedSteps: caseLog.passedSteps, failedSteps: caseLog.failedSteps },
        });
      } else {
        caseLog.status = 'skipped';
        executionLog.skippedCases++;
        sendSSEEvent({
          type: 'case_end',
          runId,
          caseId: testCase.id,
          caseStatus: 'skipped',
        });
      }

      caseLog.finishedAt = new Date().toISOString();
      caseLog.durationMs = new Date(caseLog.finishedAt).getTime() - new Date(caseStartedAt).getTime();
    }

    await currentBrowser.close();
    currentBrowser = null;
    currentRunId = null;

    executionLog.finishedAt = new Date().toISOString();
    executionLog.durationMs = new Date(executionLog.finishedAt).getTime() - new Date(startedAt).getTime();

    const logs = getLogsStorage();
    logs.unshift(executionLog);
    if (logs.length > 100) {
      logs.pop();
    }
    saveLogsStorage(logs);

    sendSSEEvent({
      type: 'complete',
      runId,
      data: {
        passedCases: executionLog.passedCases,
        failedCases: executionLog.failedCases,
        skippedCases: executionLog.skippedCases,
        canceledCases: executionLog.canceledCases,
        durationMs: executionLog.durationMs,
      },
    });

    res.json({
      success: true,
      data: executionLog,
    });
  } catch (error) {
    if (currentBrowser) {
      await currentBrowser.close();
      currentBrowser = null;
    }
    if (currentRunId) {
      sendSSEEvent({
        type: 'error',
        runId: currentRunId,
        error: error instanceof Error ? error.message : '执行失败',
      });
    }
    currentRunId = null;
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    });
  }
});

router.post('/cancel', (_req: Request, res: Response) => {
  isCancelled = true;
  if (currentBrowser) {
    currentBrowser.close().catch(() => {});
    currentBrowser = null;
  }
  res.json({ success: true, message: '取消执行' });
});

router.patch('/:runId/cases/:caseId/status', (req: Request, res: Response) => {
  try {
    const { runId, caseId } = req.params;
    const { status, stepResults, error } = req.body;

    const logs = getLogsStorage();
    const log = logs.find((l) => l.id === runId || l.runId === runId);

    if (!log) {
      res.status(404).json({
        success: false,
        error: '执行日志不存在',
      });
      return;
    }

    const caseLog = log.caseLogs.find((c) => c.caseId === caseId);
    if (!caseLog) {
      res.status(404).json({
        success: false,
        error: '用例日志不存在',
      });
      return;
    }

    const prevStatus = caseLog.status;
    caseLog.status = status;

    if (status === 'passed' && prevStatus !== 'passed') {
      log.passedCases++;
    } else if (status === 'failed' && prevStatus !== 'failed') {
      log.failedCases++;
    } else if (status === 'skipped' && prevStatus !== 'skipped') {
      log.skippedCases++;
    } else if (status === 'canceled' && prevStatus !== 'canceled') {
      log.canceledCases++;
    }

    if (error) {
      caseLog.error = error;
    }

    if (stepResults && Array.isArray(stepResults)) {
      for (const result of stepResults) {
        const stepLog = caseLog.stepLogs.find((s) => s.stepId === result.stepId);
        if (stepLog) {
          Object.assign(stepLog, result);
          if (result.status === 'passed' && stepLog.status !== 'passed') {
            caseLog.passedSteps++;
          } else if (result.status === 'failed' && stepLog.status !== 'failed') {
            caseLog.failedSteps++;
          }
        }
      }
    }

    caseLog.finishedAt = new Date().toISOString();
    if (caseLog.startedAt) {
      caseLog.durationMs = new Date(caseLog.finishedAt).getTime() - new Date(caseLog.startedAt).getTime();
    }

    log.finishedAt = new Date().toISOString();
    if (log.startedAt) {
      log.durationMs = new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime();
    }

    saveLogsStorage(logs);

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新状态失败',
    });
  }
});

router.get('/:runId', (req: Request, res: Response) => {
  const logs = getLogsStorage();
  const log = logs.find((l) => l.id === req.params.runId || l.runId === req.params.runId);

  if (!log) {
    res.status(404).json({
      success: false,
      error: '执行记录不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: log,
  });
});

export default router;
