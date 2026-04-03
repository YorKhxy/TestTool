import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import type { RunReport } from '../../shared/runTypes.js';

const router = Router();

function getReportsDir() {
  return path.resolve(process.cwd(), 'data', 'reports');
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

  const headerMap: [string, string][] = [
    ['id', '用例ID'],
    ['title', '用例描述'],
    ['group', '分组'],
    ['method', '方法'],
    ['path', '路径'],
    ['headers', 'Headers'],
    ['query', 'Query'],
    ['body', 'Body'],
    ['status', '状态'],
    ['httpStatus', 'HTTP状态码'],
    ['durationMs', '耗时(ms)'],
    ['errorMessage', '错误信息'],
    ['responseBodyPreview', '响应内容'],
    ['startedAt', '开始时间'],
    ['finishedAt', '结束时间'],
  ];

  const filteredCases = caseId
    ? json.cases.map((c, i) => ({ c, r: json.results[i]! })).filter(({ c }) => c.id === caseId)
    : json.cases.map((c, i) => ({ c, r: json.results[i]! }));

  if (filteredCases.length === 0) {
    res.status(404).json({ success: false, error: 'Case not found' });
    return;
  }

  const rows: (string | number | undefined)[][] = [headerMap.map(([, label]) => label)];

  for (const { c, r } of filteredCases) {
    rows.push([
      c.id,
      c.title,
      c.group,
      c.method,
      c.path,
      JSON.stringify(c.headers ?? {}),
      JSON.stringify(c.query ?? {}),
      typeof c.body === 'string' ? c.body : JSON.stringify(c.body ?? {}),
      r.status === 'passed' ? '通过' : r.status === 'failed' ? '失败' : r.status,
      r.httpStatus ?? '-',
      r.durationMs,
      r.errorMessage ?? '',
      r.responseBodyPreview ?? '',
      r.startedAt,
      r.finishedAt,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = [
    { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 40 },
    { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 12 },
    { wch: 12 }, { wch: 30 }, { wch: 60 }, { wch: 25 }, { wch: 25 },
  ];
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