import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  PlaywrightCase,
  PlaywrightConfig,
  PlaywrightExecutionLog,
  CaseExecutionLog,
  StepExecutionLog,
} from '../../shared/playwrightCase.js';

const router = Router();

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

router.post('/run', async (req: Request, res: Response) => {
  try {
    const { cases, config, queue } = req.body;

    if (!cases || !Array.isArray(cases)) {
      res.status(400).json({
        success: false,
        error: '缺少 cases 参数',
      });
      return;
    }

    const runId = `run_${Date.now()}`;
    const startedAt = new Date().toISOString();

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
      config: config || {
        browser: 'chromium',
        viewport: { width: 1920, height: 1080 },
        slowMo: 0,
        timeout: 30000,
        screenshotOnFailure: true,
        recordVideo: false,
        baseURL: 'http://localhost:3000',
      },
      baseURL: config?.baseURL || 'http://localhost:3000',
    };

    for (const testCase of cases) {
      const caseLog: CaseExecutionLog = {
        caseId: testCase.id,
        caseTitle: testCase.title,
        caseGroup: testCase.group,
        priority: testCase.priority,
        status: 'pending',
        startedAt: new Date().toISOString(),
        stepLogs: [],
        totalSteps: testCase.steps?.length || 0,
        passedSteps: 0,
        failedSteps: 0,
      };

      for (let i = 0; i < (testCase.steps?.length || 0); i++) {
        const step = testCase.steps[i];
        const stepLog: StepExecutionLog = {
          stepId: step.id || `step_${i}`,
          stepIndex: i,
          stepType: step.type,
          description: step.description || `Step ${i + 1}`,
          status: 'pending',
          startedAt: new Date().toISOString(),
        };
        caseLog.stepLogs.push(stepLog);
      }

      executionLog.caseLogs.push(caseLog);
    }

    const logs = getLogsStorage();
    logs.unshift(executionLog);
    if (logs.length > 100) {
      logs.pop();
    }
    saveLogsStorage(logs);

    res.json({
      success: true,
      data: {
        runId,
        executionLog,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建执行失败',
    });
  }
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
