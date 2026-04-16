export type TestCasePriority = 'P0' | 'P1' | 'P2' | 'P3' | string;

export type VariableExtractorSource = 'body' | 'header';

export type VariableExtractor = {
  id: string;
  name: string;
  source: VariableExtractorSource;
  path: string;
};

export type TestCase = {
  id: string;
  title: string;
  method: string;
  path: string;
  priority?: TestCasePriority;
  group?: string;
  requiresAuth?: boolean;
  headersRaw?: string;
  queryRaw?: string;
  bodyRaw?: string;
  expectedResult?: string;
  variableExtractors?: VariableExtractor[];
};

export type DocMeta = {
  baseUrl?: string;
  envUrl?: string;
  adminEmail?: string;
  adminPassword?: string;
};

export type ParsedTestPlan = {
  meta: DocMeta;
  cases: TestCase[];
  warnings: string[];
  rawMarkdown?: string;
};

type MdTable = {
  headers: string[];
  rows: string[][];
  endIndex: number;
};

function isTableSeparatorLine(line: string) {
  const t = line.trim();
  if (!t.startsWith('|') || !t.endsWith('|')) return false;
  const cells = t
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
  if (cells.length === 0) return false;
  return cells.every((c) => c.length > 0 && /^[-: ]+$/.test(c));
}

function parseRow(line: string) {
  const t = line.trim();
  if (!t.startsWith('|') || !t.endsWith('|')) return null;
  return t
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

function parseTable(lines: string[], startIndex: number): MdTable | null {
  const header = parseRow(lines[startIndex] ?? '');
  if (!header) return null;
  const sep = lines[startIndex + 1] ?? '';
  if (!isTableSeparatorLine(sep)) return null;

  const rows: string[][] = [];
  let i = startIndex + 2;
  for (; i < lines.length; i++) {
    const row = parseRow(lines[i] ?? '');
    if (!row) break;
    if (row.every((c) => c === '')) break;
    rows.push(row);
  }

  return { headers: header, rows, endIndex: i };
}

function normalizeKey(s: string) {
  return s.replace(/\s+/g, '').toLowerCase();
}

function guessRequiresAuth(path: string, group?: string) {
  const p = path.trim();
  if (p === '/ping') return false;
  if (p.includes('/client/') || p.includes('/front/')) return false;
  const g = (group ?? '').toLowerCase();
  if (g.includes('客户端') || g.includes('系统')) return false;
  if (p.includes('/auth/login') || p.includes('/auth/sendCode')) return false;
  return false;
}

function extractDocInfo(lines: string[], warnings: string[]): DocMeta {
  const meta: DocMeta = {};
  const idx = lines.findIndex((l) => l.trim() === '## 文档信息');
  if (idx >= 0) {
    const tableStart = lines.findIndex((l, i) => i > idx && l.trim().startsWith('|'));
    if (tableStart >= 0) {
      const t = parseTable(lines, tableStart);
      if (t) {
        const map = new Map<string, string>();
        for (const r of t.rows) {
          const k = (r[0] ?? '').trim();
          const v = (r[1] ?? '').trim();
          if (k && v) map.set(k, v);
        }
        meta.baseUrl = map.get('Base URL') ?? undefined;
        meta.envUrl = map.get('测试环境') ?? undefined;
      }
    }
  }

  if (!meta.envUrl && !meta.baseUrl) warnings.push('未从“文档信息”中解析到 Base URL/测试环境');
  return meta;
}

function extractAuthTestData(lines: string[], meta: DocMeta) {
  const idx = lines.findIndex((l) => l.trim() === '### 5.1 认证测试数据');
  if (idx < 0) return;
  const tableStart = lines.findIndex((l, i) => i > idx && l.trim().startsWith('|'));
  if (tableStart < 0) return;
  const t = parseTable(lines, tableStart);
  if (!t) return;

  const h = t.headers.map(normalizeKey);
  const typeIdx = h.findIndex((x) => x.includes('账户类型'));
  const emailIdx = h.findIndex((x) => x === 'email');
  const passIdx = h.findIndex((x) => x === 'password');
  if (typeIdx < 0 || emailIdx < 0 || passIdx < 0) return;

  for (const r of t.rows) {
    const accountType = (r[typeIdx] ?? '').trim();
    if (accountType === '管理员') {
      meta.adminEmail = (r[emailIdx] ?? '').trim() || undefined;
      meta.adminPassword = (r[passIdx] ?? '').trim() || undefined;
      return;
    }
  }
}

function parseVariableExtractors(extractRaw: string | undefined): VariableExtractor[] {
  if (!extractRaw || extractRaw === '-' || extractRaw === '') return [];

  const extractors: VariableExtractor[] = [];
  const rules = extractRaw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]!;
    const colonIdx = rule.indexOf(':');
    if (colonIdx < 0) continue;

    const name = rule.slice(0, colonIdx).trim();
    const path = rule.slice(colonIdx + 1).trim();

    if (!name || !path) continue;

    let source: VariableExtractorSource = 'body';
    let actualPath = path;
    if (path.startsWith('header.')) {
      source = 'header';
      actualPath = path.slice(7);
    } else if (path.startsWith('body.')) {
      source = 'body';
      actualPath = path.slice(5);
    }

    extractors.push({
      id: `ext_${i}`,
      name,
      source,
      path: actualPath,
    });
  }

  return extractors;
}

export function parseTestPlanMarkdown(markdown: string): ParsedTestPlan {
  const warnings: string[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const meta = extractDocInfo(lines, warnings);
  extractAuthTestData(lines, meta);

  const cases: TestCase[] = [];

  let currentGroup: string | undefined;
  for (let i = 0; i < lines.length; ) {
    const line = lines[i] ?? '';
    const h = line.match(/^#{3,4}\s+(.+)$/);
    if (h) {
      currentGroup = h[1]?.trim() || currentGroup;
      i++;
      continue;
    }

    if (line.includes('|') && line.includes('用例ID') && line.includes('路径')) {
      const table = parseTable(lines, i);
      if (!table) {
        i++;
        continue;
      }

      const headers = table.headers.map(normalizeKey);
      const idIdx = headers.findIndex((x) => x.includes('用例id'));
      const titleIdx = headers.findIndex((x) => x.includes('用例描述') || x.includes('标题'));
      const methodIdx = headers.findIndex((x) => x === '方法' || x === 'method');
      const pathIdx = headers.findIndex((x) => x.includes('路径') || x === 'path');
      const priIdx = headers.findIndex((x) => x.includes('优先级') || x.includes('priority'));
      const headersIdx = headers.findIndex((x) => x.includes('headers'));
      const queryIdx = headers.findIndex((x) => x.includes('query') || x.includes('params'));
      const bodyIdx = headers.findIndex((x) => x.includes('body') || x.includes('request'));
      const expectedIdx = headers.findIndex((x) => x.includes('预期结果') || x.includes('expected'));
      const extractIdx = headers.findIndex((x) => x.includes('提取变量') || x.includes('extract'));

      if (idIdx < 0 || titleIdx < 0 || methodIdx < 0 || pathIdx < 0) {
        warnings.push(`发现疑似用例表，但列不完整：第 ${i + 1} 行`);
        i = table.endIndex;
        continue;
      }

      for (const r of table.rows) {
        const id = (r[idIdx] ?? '').trim();
        const title = (r[titleIdx] ?? '').trim();
        const method = (r[methodIdx] ?? '').trim().toUpperCase();
        const path = (r[pathIdx] ?? '').trim();
        const priority = priIdx >= 0 ? (r[priIdx] ?? '').trim() : undefined;
        const headersRaw = headersIdx >= 0 ? (r[headersIdx] ?? '').trim() : undefined;
        const queryRaw = queryIdx >= 0 ? (r[queryIdx] ?? '').trim() : undefined;
        const bodyRaw = bodyIdx >= 0 ? (r[bodyIdx] ?? '').trim() : undefined;
        const expectedResult = expectedIdx >= 0 ? (r[expectedIdx] ?? '').trim() : undefined;
        const extractRaw = extractIdx >= 0 ? (r[extractIdx] ?? '').trim() : undefined;

        const variableExtractors = parseVariableExtractors(extractRaw);

        if (!id || !method || !path) continue;
        cases.push({
          id,
          title,
          method,
          path,
          priority,
          group: currentGroup,
          requiresAuth: guessRequiresAuth(path, currentGroup),
          headersRaw: headersRaw && headersRaw !== '-' ? headersRaw : undefined,
          queryRaw: queryRaw && queryRaw !== '-' ? queryRaw : undefined,
          bodyRaw: bodyRaw && bodyRaw !== '-' ? bodyRaw : undefined,
          expectedResult: expectedResult && expectedResult !== '-' ? expectedResult : undefined,
          variableExtractors,
        });
      }

      i = table.endIndex;
      continue;
    }

    i++;
  }

  if (cases.length === 0) warnings.push('未解析到任何用例（未找到包含“用例ID/路径”的表格）');

  return { meta, cases, warnings, rawMarkdown: markdown };
}
