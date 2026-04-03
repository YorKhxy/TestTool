import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import type { RunReport } from '../../shared/runTypes.js';

const router = Router();

function getReportsDir() {
  return path.resolve(process.cwd(), 'data', 'reports');
}

function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let result: unknown = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return undefined;
    if (typeof result === 'object' && key in (result as Record<string, unknown>)) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return result;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

router.get('/:runId', async (req: Request, res: Response) => {
  const runId = req.params.runId;
  const caseId = req.query.caseId as string | undefined;
  if (!runId) {
    res.status(400).json({ success: false, error: 'runId is required' });
    return;
  }
  const filePath = path.join(getReportsDir(), `${runId}.json`);
  let json: RunReport;
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    json = JSON.parse(raw) as RunReport;
  } catch {
    res.status(404).json({ success: false, error: 'Report not found' });
    return;
  }

  const caseFields: { key: string; label: string; width?: number }[] = [
    { key: 'id', label: '用例ID', width: 15 },
    { key: 'title', label: '用例描述', width: 30 },
    { key: 'group', label: '分组', width: 20 },
    { key: 'method', label: '方法', width: 8 },
    { key: 'path', label: '路径', width: 40 },
    { key: 'priority', label: '优先级', width: 10 },
    { key: 'headers', label: 'Headers', width: 30 },
    { key: 'query', label: 'Query', width: 25 },
    { key: 'body', label: 'Body', width: 40 },
    { key: 'expectedResult', label: '预期结果', width: 50 },
  ];

  const resultFields: { key: string; label: string; width?: number }[] = [
    { key: 'status', label: '状态', width: 10 },
    { key: 'httpStatus', label: 'HTTP状态码', width: 12 },
    { key: 'durationMs', label: '耗时(ms)', width: 12 },
    { key: 'errorMessage', label: '错误信息', width: 40 },
    { key: 'responseBodyPreview', label: '响应内容', width: 60 },
    { key: 'startedAt', label: '开始时间', width: 25 },
    { key: 'finishedAt', label: '结束时间', width: 25 },
  ];

  const allFields = [...caseFields, ...resultFields];
  const fieldLabels = allFields.map(f => f.label);

  const filteredCases = caseId
    ? json.cases.map((c, i) => ({ c, r: json.results[i]! })).filter(({ c }) => c.id === caseId)
    : json.cases.map((c, i) => ({ c, r: json.results[i]! }));

  if (filteredCases.length === 0) {
    res.status(404).json({ success: false, error: 'Case not found' });
    return;
  }

  const rows: (string | number | undefined)[][] = [fieldLabels];

  for (const { c, r } of filteredCases) {
    const row: (string | number | undefined)[] = [];

    for (const field of caseFields) {
      let caseValue: unknown;
      if (field.key === 'headers' || field.key === 'query' || field.key === 'body') {
        caseValue = getNestedValue(c, field.key);
        if (typeof caseValue === 'object') {
          caseValue = JSON.stringify(caseValue);
        }
      } else {
        caseValue = getNestedValue(c, field.key);
      }
      row.push(formatCellValue(caseValue));
    }

    for (const field of resultFields) {
      const resultValue = getNestedValue(r, field.key);
      if (field.key === 'status') {
        row.push(resultValue === 'passed' ? '通过' : resultValue === 'failed' ? '失败' : formatCellValue(resultValue));
      } else {
        row.push(formatCellValue(resultValue));
      }
    }

    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = allFields.map(f => ({ wch: f.width || 25 }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, caseId ? '用例详情' : '测试报告');

  const filename = caseId ? `${runId}_${caseId}.xlsx` : `${runId}_report.xlsx`;
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

export default router;