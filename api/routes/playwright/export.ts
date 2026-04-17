import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import type { PlaywrightExecutionLog } from '../../../shared/playwrightCase.ts';
import * as XLSX from 'xlsx';

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

router.post('/', (req: Request, res: Response) => {
  try {
    const { logId } = req.body;

    const logs = getLogsStorage();
    const log = logs.find((l) => l.id === logId);

    if (!log) {
      res.status(404).json({
        success: false,
        error: '执行日志不存在',
      });
      return;
    }

    const workbook = XLSX.utils.book_new();

    const summaryData: Record<string, unknown>[] = [
      { '项目': '执行ID', '值': log.runId },
      { '项目': '套件名称', '值': log.suiteName },
      { '项目': '开始时间', '值': new Date(log.startedAt).toLocaleString('zh-CN') },
      { '项目': '结束时间', '值': log.finishedAt ? new Date(log.finishedAt).toLocaleString('zh-CN') : '-' },
      { '项目': '执行时长(秒)', '值': log.durationMs ? (log.durationMs / 1000).toFixed(2) : '-' },
      { '项目': '总用例数', '值': log.totalCases },
      { '项目': '通过数', '值': log.passedCases },
      { '项目': '失败数', '值': log.failedCases },
      { '项目': '跳过数', '值': log.skippedCases },
      { '项目': '取消数', '值': log.canceledCases },
      { '项目': '浏览器', '值': log.config?.browser || '-' },
      { '项目': 'BaseURL', '值': log.baseURL || '-' },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '执行概况');

    const caseData: Record<string, unknown>[] = [];
    for (const caseLog of log.caseLogs) {
      caseData.push({
        '用例ID': caseLog.caseId,
        '用例标题': caseLog.caseTitle,
        '分组': caseLog.caseGroup || '-',
        '优先级': caseLog.priority || '-',
        '状态': caseLog.status,
        '开始时间': new Date(caseLog.startedAt).toLocaleString('zh-CN'),
        '结束时间': caseLog.finishedAt ? new Date(caseLog.finishedAt).toLocaleString('zh-CN') : '-',
        '耗时(秒)': caseLog.durationMs ? (caseLog.durationMs / 1000).toFixed(2) : '-',
        '总步骤数': caseLog.totalSteps,
        '通过步骤': caseLog.passedSteps,
        '失败步骤': caseLog.failedSteps,
        '错误信息': caseLog.error || '-',
      });
    }

    const caseSheet = XLSX.utils.json_to_sheet(caseData);
    XLSX.utils.book_append_sheet(workbook, caseSheet, '用例详情');

    for (const caseLog of log.caseLogs) {
      const stepData: Record<string, unknown>[] = [];
      for (const step of caseLog.stepLogs) {
        stepData.push({
          '用例ID': caseLog.caseId,
          '用例标题': caseLog.caseTitle,
          '步骤序号': step.stepIndex + 1,
          '步骤类型': step.stepType,
          '步骤描述': step.description,
          '状态': step.status,
          '开始时间': new Date(step.startedAt).toLocaleString('zh-CN'),
          '结束时间': step.finishedAt ? new Date(step.finishedAt).toLocaleString('zh-CN') : '-',
          '耗时(秒)': step.durationMs ? (step.durationMs / 1000).toFixed(2) : '-',
          '请求URL': step.request?.url || '-',
          '请求方法': step.request?.method || '-',
          '请求Headers': step.request?.headers ? JSON.stringify(step.request.headers) : '-',
          '请求Body': step.request?.body ? (typeof step.request.body === 'string' ? step.request.body : JSON.stringify(step.request.body)) : '-',
          '响应状态码': step.response?.status || '-',
          '响应Body': step.response?.body ? (typeof step.response.body === 'string' ? step.response.body : JSON.stringify(step.response.body).slice(0, 500)) : '-',
          '断言预期': step.assertResult?.expected || '-',
          '断言实际': step.assertResult?.actual || '-',
          '断言操作符': step.assertResult?.operator || '-',
          '断言结果': step.assertResult?.passed ? '通过' : '失败',
          '错误信息': step.error || '-',
        });
      }

      if (stepData.length > 0) {
        const safeSheetName = `步骤_${caseLog.caseId.slice(0, 25)}`.replace(/[\\\/\?\*\[\]]/g, '_');
        const stepSheet = XLSX.utils.json_to_sheet(stepData);
        XLSX.utils.book_append_sheet(workbook, stepSheet, safeSheetName);
      }
    }

    const fileName = `playwright_report_${log.runId}_${Date.now()}.xlsx`;
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '导出失败',
    });
  }
});

export default router;
