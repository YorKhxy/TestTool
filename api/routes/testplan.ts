import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import { parseTestPlanMarkdown } from '../../shared/testPlan.js';

const router = Router();

router.post('/parse', (req: Request, res: Response) => {
  const markdown = typeof req.body?.markdown === 'string' ? req.body.markdown : '';
  if (!markdown.trim()) {
    res.status(400).json({ success: false, error: 'markdown 不能为空' });
    return;
  }
  const parsed = parseTestPlanMarkdown(markdown);
  res.json({ success: true, data: parsed });
});

router.post('/save', async (req: Request, res: Response) => {
  const { filePath, format, cases, overrides } = req.body as {
    filePath?: string;
    format?: 'markdown' | 'excel';
    cases?: unknown[];
    overrides?: Record<string, OverrideData>;
  };

  if (!filePath || typeof filePath !== 'string') {
    res.status(400).json({ success: false, error: '文件路径无效' });
    return;
  }

  if (!format || !['markdown', 'excel'].includes(format)) {
    res.status(400).json({ success: false, error: 'format 必须为 markdown 或 excel' });
    return;
  }

  if (!cases || !Array.isArray(cases)) {
    res.status(400).json({ success: false, error: 'cases 不能为空' });
    return;
  }

  try {
    let content: string | Buffer;
    if (format === 'markdown') {
      content = generateMarkdownWithOverrides(cases, overrides ?? {});
    } else {
      content = generateExcelWithOverrides(cases, overrides ?? {});
    }

    const resolvedPath = path.resolve(filePath);
    await fs.writeFile(resolvedPath, content);
    res.json({ success: true, path: resolvedPath });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '保存失败';
    res.status(500).json({ success: false, error: msg });
  }
});

type OverrideData = {
  requiresAuth?: boolean;
  headersText: string;
  queryText: string;
  bodyText: string;
  expectedResult?: string;
  path?: string;
};

router.post('/export', async (req: Request, res: Response) => {
  const { format, cases, overrides, meta, rawMarkdown } = req.body as {
    format?: 'markdown' | 'excel';
    cases?: unknown[];
    overrides?: Record<string, OverrideData>;
    meta?: {
      baseUrl?: string;
      envUrl?: string;
      authToken?: string;
      projectName?: string;
      version?: string;
    };
    rawMarkdown?: string;
  };

  if (!format || !['markdown', 'excel'].includes(format)) {
    res.status(400).json({ success: false, error: 'format 必须为 markdown 或 excel' });
    return;
  }

  if (!cases || !Array.isArray(cases)) {
    res.status(400).json({ success: false, error: 'cases 不能为空' });
    return;
  }

  if (format === 'markdown') {
    let markdown: string;
    if (rawMarkdown) {
      markdown = applyOverridesToMarkdown(rawMarkdown, cases, overrides ?? {});
    } else {
      markdown = generateMarkdownWithOverrides(cases, overrides ?? {}, meta);
    }
    const filename = `testcases_export_${Date.now()}.md`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(markdown);
  } else {
    const excelBuffer = generateExcelWithOverrides(cases, overrides ?? {});
    const filename = `testcases_export_${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
  }
});

function applyOverridesToMarkdown(
  rawMarkdown: string,
  cases: unknown[],
  overrides: Record<string, OverrideData>
): string {
  const lines = rawMarkdown.split('\n');
  const result: string[] = [];
  let i = 0;
  let inCaseTable = false;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '## 文档信息') {
      inCaseTable = false;
      result.push(line);
      i++;
      continue;
    }

    if (line.includes('|') && line.includes('用例ID') && line.includes('路径')) {
      inCaseTable = true;
      result.push(line);
      i++;
      if (i < lines.length && lines[i].match(/^\|[-| :]+\|/)) {
        result.push(lines[i]);
        i++;
      }
      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('---')) {
        const caseLine = lines[i];
        const match = caseLine.match(/^\|\s*([^|]+)/);
        if (match) {
          const caseId = (match[1] ?? '').trim();
          const override = overrides[caseId];
          if (override) {
            result.push(buildCaseLine(caseLine, cases, caseId, overrides));
          } else {
            result.push(caseLine);
          }
        } else {
          result.push(caseLine);
        }
        i++;
      }
      inCaseTable = false;
      continue;
    }

    result.push(line);
    i++;
  }

  return result.join('\n');
}

function buildCaseLine(originalLine: string, cases: unknown[], caseId: string, overrides: Record<string, OverrideData>): string {
  const c = (cases as Array<Record<string, unknown>>).find((x) => String(x.id) === caseId);
  if (!c) return originalLine;

  const override = overrides[caseId];
  const finalPath = override?.path ?? String(c.path ?? '');
  const finalExpected = override?.expectedResult ?? String(c.expectedResult ?? '');
  const finalHeaders = override?.headersText ?? String(c.headersRaw ?? '{}');
  const finalQuery = override?.queryText ?? String(c.queryRaw ?? '{}');
  const finalBody = override?.bodyText ?? String(c.bodyRaw ?? '');
  const finalExtract = String(c.variableExtractors ?? '-');

  return `| ${caseId} | ${String(c.title ?? '')} | ${String(c.method ?? '')} | ${finalPath} | ${finalHeaders} | ${finalQuery} | ${finalBody} | ${String(c.priority ?? '')} | ${finalExpected} | ${finalExtract} |`;
}

function generateMarkdownFromRaw(
  cases: unknown[],
  overrides: Record<string, OverrideData>,
  rawMarkdown?: string
): string {
  if (!rawMarkdown) {
    return generateMarkdownWithOverrides(cases, overrides);
  }

  const lines = rawMarkdown.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const tableIdx = line.match(/^\| ?用例ID/);
    if (tableIdx) {
      result.push(line);
      i++;

      if (i < lines.length && lines[i].match(/^\|[-| ]/)) {
        result.push(lines[i]);
        i++;
      }

      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('---')) {
        const caseLine = lines[i];
        const match = caseLine.match(/^\| ?([^ |]+)/);
        if (match) {
          const caseId = match[1].trim();
          const override = overrides[caseId];
          if (override) {
            result.push(rebuildCaseLine(caseLine, cases, caseId, overrides));
          } else {
            result.push(caseLine);
          }
        } else {
          result.push(caseLine);
        }
        i++;
      }
      continue;
    }

    result.push(line);
    i++;
  }

  return result.join('\n');
}

function rebuildCaseLine(originalLine: string, cases: unknown[], caseId: string, overrides: Record<string, OverrideData>): string {
  const c = (cases as Array<Record<string, unknown>>).find((x) => String(x.id) === caseId);
  if (!c) return originalLine;

  const override = overrides[caseId];
  if (!override) return originalLine;

  const parts = originalLine.split('|').map((p: string) => p.trim());

  const finalPath = override.path ?? String(c.path ?? '');
  const finalExpected = override.expectedResult ?? String(c.expectedResult ?? '');
  const finalHeaders = override.headersText ?? String(c.headersRaw ?? '{}');
  const finalQuery = override.queryText ?? String(c.queryRaw ?? '{}');
  const finalBody = override.bodyText ?? String(c.bodyRaw ?? '');
  const finalExtract = String(c.variableExtractors ?? '-');

  return `| ${caseId} | ${String(c.title ?? '')} | ${String(c.method ?? '')} | ${finalPath} | ${finalHeaders} | ${finalQuery} | ${finalBody} | ${String(c.priority ?? '')} | ${finalExpected} | ${finalExtract} |`;
}

function generateMarkdownWithOverrides(
  cases: unknown[],
  overrides: Record<string, OverrideData>,
  meta?: {
    baseUrl?: string;
    envUrl?: string;
    authToken?: string;
    projectName?: string;
    version?: string;
  }
): string {
  const lines: string[] = [
    '# API 测试用例',
    '',
    '## 文档信息',
    '',
    '| 属性 | 内容 |',
    '|------|------|',
  ];

  if (meta) {
    if (meta.projectName) lines.push(`| 项目名称 | ${meta.projectName} |`);
    if (meta.version) lines.push(`| API版本 | ${meta.version} |`);
    if (meta.baseUrl) lines.push(`| Base URL | ${meta.baseUrl} |`);
    if (meta.envUrl) lines.push(`| 测试环境 | ${meta.envUrl} |`);
    if (meta.authToken) lines.push(`| 认证Token | ${meta.authToken} |`);
  }

  lines.push('', `| 导出时间 | ${new Date().toLocaleString('zh-CN')} |`, '', '---', '', '## 用例列表', '', '| 用例ID | 用例描述 | 方法 | 路径 | Headers | Query Params | Request Body | 优先级 | 预期结果 | 提取变量 |', '|-------|---------|------|------|---------|--------------|--------------|-------|---------|---------|');

  for (const c of cases as Array<Record<string, unknown>>) {
    const id = String(c.id ?? '');
    const title = String(c.title ?? '');
    const method = String(c.method ?? '');
    const originalPath = String(c.path ?? '');
    const priority = String(c.priority ?? '');
    const originalExpected = String(c.expectedResult ?? '');
    const originalHeaders = String(c.headersRaw ?? '{}');
    const originalQuery = String(c.queryRaw ?? '{}');
    const originalBody = String(c.bodyRaw ?? '');
    const originalExtract = String(c.variableExtractors ?? '-');

    const o = overrides[id];
    const finalPath = o?.path ?? originalPath;
    const finalExpected = o?.expectedResult ?? originalExpected;
    const finalHeaders = o?.headersText ?? originalHeaders;
    const finalQuery = o?.queryText ?? originalQuery;
    const finalBody = o?.bodyText ?? originalBody;

    lines.push(`| ${id} | ${title} | ${method} | ${finalPath} | ${finalHeaders} | ${finalQuery} | ${finalBody} | ${priority} | ${finalExpected} | ${originalExtract} |`);
  }

  return lines.join('\n');
}

function generateExcelWithOverrides(cases: unknown[], overrides: Record<string, OverrideData>): Buffer {
  const headers = ['用例ID', '用例描述', '方法', '路径', 'Headers', 'Query Params', 'Request Body', '优先级', '预期结果', '提取变量'];
  const rows: (string | number | undefined)[][] = [headers];

  for (const c of cases as Array<Record<string, unknown>>) {
    const id = String(c.id ?? '');
    const title = String(c.title ?? '');
    const method = String(c.method ?? '');
    const originalPath = String(c.path ?? '');
    const priority = String(c.priority ?? '');
    const originalExpected = String(c.expectedResult ?? '');
    const originalHeaders = String(c.headersRaw ?? '{}');
    const originalQuery = String(c.queryRaw ?? '{}');
    const originalBody = String(c.bodyRaw ?? '');
    const originalExtract = String(c.variableExtractors ?? '-');

    const o = overrides[id];
    const finalPath = o?.path ?? originalPath;
    const finalExpected = o?.expectedResult ?? originalExpected;
    const finalHeaders = o?.headersText ?? originalHeaders;
    const finalQuery = o?.queryText ?? originalQuery;
    const finalBody = o?.bodyText ?? originalBody;

    rows.push([id, title, method, finalPath, finalHeaders, finalQuery, finalBody, priority, finalExpected, originalExtract]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 15 }, { wch: 30 }, { wch: 8 }, { wch: 40 },
    { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 10 },
    { wch: 50 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '测试用例');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export default router;

