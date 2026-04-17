import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  PlaywrightCase,
  PlaywrightConfig,
  PlaywrightExecutionLog,
  CaseExecutionLog,
  StepExecutionLog,
  ExecutionStatus,
} from '../../../shared/playwrightCase.ts';

const router = Router();

function loadLogsFromFile(): PlaywrightExecutionLog[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'playwright_logs.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load logs:', e);
  }
  return [];
}

function saveLogsToFile(logs: PlaywrightExecutionLog[]): void {
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

router.get('/', (_req: Request, res: Response) => {
  const logs = loadLogsFromFile();
  res.json({
    success: true,
    data: logs,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const logs = loadLogsFromFile();
  const log = logs.find((l) => l.id === req.params.id);
  if (!log) {
    res.status(404).json({
      success: false,
      error: '日志不存在',
    });
    return;
  }
  res.json({
    success: true,
    data: log,
  });
});

router.post('/', (req: Request, res: Response) => {
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

    const logs = loadLogsFromFile();
    logs.unshift(executionLog);
    if (logs.length > 100) {
      logs.pop();
    }
    saveLogsToFile(logs);

    res.json({
      success: true,
      data: executionLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建执行日志失败',
    });
  }
});

router.patch('/:runId/cases/:caseId/status', (req: Request, res: Response) => {
  try {
    const { runId, caseId } = req.params;
    const { status, stepResults } = req.body;
    const logs = loadLogsFromFile();

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

    caseLog.status = status;
    if (status === 'passed') {
      log.passedCases++;
    } else if (status === 'failed') {
      log.failedCases++;
    } else if (status === 'skipped') {
      log.skippedCases++;
    } else if (status === 'canceled') {
      log.canceledCases++;
    }

    if (stepResults && Array.isArray(stepResults)) {
      for (const result of stepResults) {
        const stepLog = caseLog.stepLogs.find((s) => s.stepId === result.stepId);
        if (stepLog) {
          Object.assign(stepLog, result);
          if (result.status === 'passed') {
            caseLog.passedSteps++;
          } else if (result.status === 'failed') {
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

    saveLogsToFile(logs);

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

router.delete('/:id', (req: Request, res: Response) => {
  const logs = loadLogsFromFile();
  const index = logs.findIndex((l) => l.id === req.params.id);
  if (index === -1) {
    res.status(404).json({
      success: false,
      error: '日志不存在',
    });
    return;
  }

  const mdFilePath = path.join(process.cwd(), 'data', `playwright_log_${req.params.id}.md`);
  if (fs.existsSync(mdFilePath)) {
    fs.unlinkSync(mdFilePath);
  }

  logs.splice(index, 1);
  saveLogsToFile(logs);

  res.json({
    success: true,
  });
});

router.get('/:id/markdown', (req: Request, res: Response) => {
  const logs = loadLogsFromFile();
  const log = logs.find((l) => l.id === req.params.id);
  if (!log) {
    res.status(404).json({
      success: false,
      error: '日志不存在',
    });
    return;
  }

  const md = generateMarkdownLog(log);
  res.json({
    success: true,
    data: md,
  });
});

export function generateMarkdownLog(log: PlaywrightExecutionLog): string {
  const lines: string[] = [];

  lines.push(`# Playwright 执行报告\n`);
  lines.push(`**执行ID**: ${log.runId}\n`);
  lines.push(`**套件名称**: ${log.suiteName}\n`);
  lines.push(`**开始时间**: ${new Date(log.startedAt).toLocaleString('zh-CN')}\n`);
  if (log.finishedAt) {
    lines.push(`**结束时间**: ${new Date(log.finishedAt).toLocaleString('zh-CN')}\n`);
    lines.push(`**执行时长**: ${(log.durationMs! / 1000).toFixed(2)} 秒\n`);
  }
  lines.push(`\n## 执行概况\n`);
  lines.push(`| 项目 | 数量 |\n`);
  lines.push(`|------|------|\n`);
  lines.push(`| 总用例数 | ${log.totalCases} |\n`);
  lines.push(`| 通过 | ${log.passedCases} |\n`);
  lines.push(`| 失败 | ${log.failedCases} |\n`);
  lines.push(`| 跳过 | ${log.skippedCases} |\n`);
  lines.push(`| 取消 | ${log.canceledCases} |\n`);
  lines.push(`\n## 用例详情\n`);

  for (const caseLog of log.caseLogs) {
    const statusIcon = caseLog.status === 'passed' ? '✅' : caseLog.status === 'failed' ? '❌' : caseLog.status === 'skipped' ? '⏭️' : '🔄';
    lines.push(`\n### ${statusIcon} ${caseLog.caseId} - ${caseLog.caseTitle}\n`);
    lines.push(`\n**分组**: ${caseLog.caseGroup || '-'}\n`);
    lines.push(`**优先级**: ${caseLog.priority || '-'}\n`);
    lines.push(`**状态**: ${caseLog.status}\n`);
    lines.push(`**开始时间**: ${new Date(caseLog.startedAt).toLocaleString('zh-CN')}\n`);
    if (caseLog.finishedAt) {
      lines.push(`**结束时间**: ${new Date(caseLog.finishedAt).toLocaleString('zh-CN')}\n`);
      lines.push(`**耗时**: ${(caseLog.durationMs! / 1000).toFixed(2)} 秒\n`);
    }
    lines.push(`**步骤**: ${caseLog.passedSteps}/${caseLog.totalSteps} 通过\n`);

    if (caseLog.error) {
      lines.push(`\n**错误信息**:\n\`\`\`\n${caseLog.error}\n\`\`\`\n`);
    }

    lines.push(`\n#### 执行步骤\n`);
    lines.push(`| # | 类型 | 描述 | 状态 | 耗时 |`);
    lines.push(`|---|------|------|------|------|\n`);

    for (let i = 0; i < caseLog.stepLogs.length; i++) {
      const step = caseLog.stepLogs[i];
      const stepIcon = step.status === 'passed' ? '✅' : step.status === 'failed' ? '❌' : step.status === 'skipped' ? '⏭️' : '🔄';
      const duration = step.durationMs ? `${(step.durationMs / 1000).toFixed(2)}s` : '-';
      lines.push(`| ${i + 1} | ${step.stepType} | ${step.description} | ${stepIcon} ${step.status} | ${duration} |\n`);

      if (step.request) {
        lines.push(`\n**请求**:\n`);
        lines.push(`- URL: \`${step.request.url || '-'}\`\n`);
        lines.push(`- Method: ${step.request.method || '-'}\n`);
        if (step.request.headers) {
          lines.push(`- Headers: \`${JSON.stringify(step.request.headers)}\`\n`);
        }
        if (step.request.body) {
          lines.push(`- Body: \`${JSON.stringify(step.request.body)}\`\n`);
        }
      }

      if (step.response) {
        lines.push(`\n**响应**:\n`);
        lines.push(`- Status: ${step.response.status || '-'}\n`);
        if (step.response.body) {
          lines.push(`- Body: \`${JSON.stringify(step.response.body).slice(0, 500)}\`\n`);
        }
      }

      if (step.assertResult) {
        lines.push(`\n**断言结果**:\n`);
        lines.push(`- Expected: \`${step.assertResult.expected}\`\n`);
        lines.push(`- Actual: \`${step.assertResult.actual}\`\n`);
        lines.push(`- Operator: \`${step.assertResult.operator}\`\n`);
        lines.push(`- Passed: ${step.assertResult.passed ? '✅' : '❌'}\n`);
      }

      if (step.error) {
        lines.push(`\n**错误**: \`${step.error}\`\n`);
      }
    }
  }

  lines.push(`\n---\n`);
  lines.push(`*报告生成时间: ${new Date().toLocaleString('zh-CN')}*\n`);

  return lines.join('');
}

export default router;
