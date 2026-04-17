import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { CaseRequest, CaseResult, RunConfig, RunReport, RunSummary, VariableExtractor, ExtractedVariables } from '../../shared/runTypes.js';

const router = Router();

function nowIso() {
  return new Date().toISOString();
}

function makeRunId() {
  const rnd = Math.random().toString(16).slice(2, 10);
  return `run_${Date.now()}_${rnd}`;
}

function getDataDir() {
  return path.resolve(process.cwd(), 'data');
}

function getReportsDir() {
  return path.join(getDataDir(), 'reports');
}

async function ensureReportsDir() {
  await fs.mkdir(getReportsDir(), { recursive: true });
}

function buildUrl(baseUrl: string, pathname: string, query?: Record<string, string>) {
  const url = new URL(pathname, baseUrl);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (typeof v !== 'string') continue;
      if (v === '') continue;
      url.searchParams.set(k, v);
    }
  }
  return url;
}

function safePreview(text: string, maxLen = 4000) {
  const t = text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  return t;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function login(baseUrl: string, auth: NonNullable<RunConfig['auth']>, timeoutMs: number) {
  const url = buildUrl(baseUrl, '/hashrate/admin/auth/v1/login/password');
  const body: Record<string, unknown> = { email: auth.email, password: auth.password };
  if (auth.mfaCode) body.mfa_code = auth.mfaCode;

  const res = await fetchWithTimeout(
    url.toString(),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );

  const text = await res.text();
  if (!res.ok) throw new Error(`登录失败：HTTP ${res.status} ${safePreview(text)}`);
  try {
    const parsed = JSON.parse(text) as unknown;
    const token =
      (isRecord(parsed) && typeof parsed.token === 'string' ? parsed.token : null) ??
      (isRecord(parsed) && isRecord(parsed.data) && typeof parsed.data.token === 'string' ? parsed.data.token : null) ??
      (isRecord(parsed) && isRecord(parsed.result) && typeof parsed.result.token === 'string' ? parsed.result.token : null);
    if (typeof token === 'string' && token) return token;
  } catch {
    throw new Error(`登录响应不是JSON格式: ${safePreview(text)}`);
  }
  throw new Error(`登录响应未包含token: ${safePreview(text)}`);
}

function parseExpectedResult(expected: string | undefined): { expectedStatus: number | null; expectedContent: string[] } {
  const result = { expectedStatus: null as number | null, expectedContent: [] as string[] };
  if (!expected) return result;

  const httpMatch = expected.match(/HTTP\s*(\d{3})/i);
  if (httpMatch) {
    result.expectedStatus = parseInt(httpMatch[1], 10);
  }

  const semicolonParts = expected.split(';');
  for (const part of semicolonParts) {
    const trimmed = part.trim();
    if (trimmed.toLowerCase().startsWith('http')) continue;

    const contentMatch = trimmed.match(/响应体[包含含有]"?([^"]+)"?/);
    if (contentMatch) {
      const content = contentMatch[1].trim();
      const items = content.split(/[,;]/).map(s => s.trim()).filter(s => s);
      result.expectedContent.push(...items);
    } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      result.expectedContent.push(trimmed.slice(1, -1));
    } else if (trimmed && !trimmed.startsWith('HTTP')) {
      result.expectedContent.push(trimmed);
    }
  }

  return result;
}

function checkResponseMatchesExpected(responseJson: unknown, expected: ReturnType<typeof parseExpectedResult>): boolean {
  if (expected.expectedStatus === null && expected.expectedContent.length === 0) {
    return true;
  }

  for (const content of expected.expectedContent) {
    const normalizedContent = content.replace(/[{}]/g, '').trim();

    if (normalizedContent.includes(':')) {
      const [key, ...valueParts] = normalizedContent.split(':');
      const keyTrimmed = key.trim();
      const valueTrimmed = valueParts.join(':').trim();

      if (!isRecord(responseJson)) return false;
      const actualValue = (responseJson as Record<string, unknown>)[keyTrimmed];
      if (actualValue === undefined) return false;

      const actualStr = String(actualValue);
      if (!actualStr.includes(valueTrimmed) && actualStr !== valueTrimmed) {
        return false;
      }
    } else {
      const responseStr = JSON.stringify(responseJson);
      if (!responseStr.includes(normalizedContent)) {
        return false;
      }
    }
  }

  return true;
}

function shouldPassByBody(responseJson: unknown): boolean | null {
  if (!isRecord(responseJson)) return null;
  if (!('code' in responseJson)) return null;
  const code = responseJson.code;
  if (typeof code !== 'number') return null;
  return code === 200;
}

function extractValueByPath(obj: unknown, pathStr: string): unknown {
  if (!isRecord(obj) && !Array.isArray(obj)) return undefined;
  const parts = pathStr.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (isRecord(current)) {
      current = (current as Record<string, unknown>)[part];
    } else if (Array.isArray(current)) {
      const idx = parseInt(part, 10);
      if (isNaN(idx)) return undefined;
      current = current[idx];
    } else {
      return undefined;
    }
  }
  return current;
}

function extractVariables(responseJson: unknown, responseHeaders: Record<string, string>, extractors: VariableExtractor[] | undefined): ExtractedVariables {
  const vars: ExtractedVariables = {};
  if (!extractors || extractors.length === 0) return vars;

  for (const extractor of extractors) {
    let value: unknown;
    if (extractor.source === 'header') {
      value = responseHeaders[extractor.path];
    } else {
      value = extractValueByPath(responseJson, extractor.path);
    }
    if (value !== undefined) {
      vars[extractor.name] = value as string | number | boolean | object;
    }
  }

  return vars;
}

function replaceVariables(text: string, vars: ExtractedVariables): string {
  return text.replace(/\$\{([^}]+)\}/g, (_match, varName) => {
    const trimmedName = varName.trim();
    if (trimmedName in vars) {
      const value = vars[trimmedName];
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    }
    return _match;
  });
}

async function runOneCase(c: CaseRequest, config: RunConfig, token: string | null): Promise<CaseResult> {
  const startedAt = nowIso();
  const start = Date.now();
  try {
    const url = buildUrl(config.baseUrl, c.path, c.query);
    const headers: Record<string, string> = {};
    if (c.headers) {
      for (const [k, v] of Object.entries(c.headers)) {
        if (typeof v === 'string') headers[k] = v;
      }
    }
    const needsAuth = c.requiresAuth === true;
    if (needsAuth && token && !headers['authorization'] && !headers['Authorization']) {
      headers.authorization = `Bearer ${token}`;
    }

    let body: string | undefined;
    if (c.body !== undefined && c.method !== 'GET' && c.method !== 'HEAD') {
      if (typeof c.body === 'string') {
        body = c.body;
      } else {
        body = JSON.stringify(c.body);
        if (!headers['content-type'] && !headers['Content-Type']) headers['content-type'] = 'application/json';
      }
    }

    const res = await fetchWithTimeout(
      url.toString(),
      {
        method: c.method,
        headers,
        body,
      },
      config.timeoutMs,
    );

    const text = await res.text();
    const finishedAt = nowIso();
    const durationMs = Date.now() - start;

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    let status: CaseResult['status'] = 'failed';
    if (res.ok) {
      if (c.expectedResult) {
        const expected = parseExpectedResult(c.expectedResult);
        if (expected.expectedStatus !== null && res.status !== expected.expectedStatus) {
          status = 'failed';
        } else if (json && expected.expectedContent.length > 0) {
          const contentMatches = checkResponseMatchesExpected(json, expected);
          status = contentMatches ? 'passed' : 'failed';
        } else {
          status = 'passed';
        }
      } else {
        const byBody = shouldPassByBody(json);
        status = byBody ? 'passed' : 'failed';
      }
    } else {
      if (c.expectedResult) {
        const expected = parseExpectedResult(c.expectedResult);
        if (expected.expectedStatus === res.status) {
          status = 'passed';
        } else {
          status = 'failed';
        }
      }
    }

    let extractedVariables: ExtractedVariables = {};
    if (res.ok && json) {
      extractedVariables = extractVariables(json, {}, c.variableExtractors);
    }

    return {
      caseId: c.id,
      status,
      startedAt,
      finishedAt,
      durationMs,
      httpStatus: res.status,
      responseBodyPreview: safePreview(text),
      expectedResult: c.expectedResult,
      extractedVariables,
    };
  } catch (e: unknown) {
    const finishedAt = nowIso();
    const durationMs = Date.now() - start;
    return {
      caseId: c.id,
      status: 'failed',
      startedAt,
      finishedAt,
      durationMs,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
      expectedResult: c.expectedResult,
      extractedVariables: {},
    };
  }
}

function summarize(runId: string, startedAt: string, results: CaseResult[]): RunSummary {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let canceled = 0;
  for (const r of results) {
    if (r.status === 'passed') passed++;
    else if (r.status === 'failed') failed++;
    else if (r.status === 'skipped') skipped++;
    else if (r.status === 'canceled') canceled++;
  }
  const finishedAt = nowIso();
  const durationMs = Date.now() - new Date(startedAt).getTime();
  return {
    runId,
    startedAt,
    finishedAt,
    total: results.length,
    passed,
    failed,
    skipped,
    canceled,
    durationMs,
  };
}

async function runAll(cases: CaseRequest[], config: RunConfig, initialVars?: ExtractedVariables) {
  const startedAt = nowIso();
  const runId = makeRunId();

  const needAuth = cases.some((c) => c.requiresAuth === true);
  const token = needAuth && config.auth ? await login(config.baseUrl, config.auth, config.timeoutMs) : null;

  const results: CaseResult[] = [];
  const concurrency = Math.max(1, Math.min(10, Math.floor(config.concurrency || 1)));
  const useConcurrency = concurrency > 1 && !cases.some((c) => c.variableExtractors && c.variableExtractors.length > 0);

  if (useConcurrency) {
    let cursor = 0;
    let stoppedByFail = false;
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (true) {
        const idx = cursor;
        cursor++;
        if (idx >= cases.length) return;
        if (stoppedByFail) return;

        const r = await runOneCase(cases[idx]!, config, token);
        results[idx] = r;
        if (!config.continueOnFail && r.status === 'failed') {
          stoppedByFail = true;
        }
      }
    });
    await Promise.all(workers);

    for (let i = 0; i < cases.length; i++) {
      if (!results[i]) {
        results[i] = {
          caseId: cases[i]!.id,
          status: 'canceled',
          startedAt,
          finishedAt: nowIso(),
          durationMs: 0,
          errorMessage: '已停止',
        };
      }
    }

    const summary = summarize(runId, startedAt, results);
    const report: RunReport = {
      summary,
      config,
      cases,
      results,
    };

    await ensureReportsDir();
    const filePath = path.join(getReportsDir(), `${runId}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
    return report;
  } else {
    let globalVars: ExtractedVariables = initialVars ? { ...initialVars } : {};

    const caseResults: (CaseResult | undefined)[] = new Array(cases.length).fill(undefined);

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < cases.length; i++) {
        const c = { ...cases[i]! };
        const hasExtractors = c.variableExtractors && c.variableExtractors.length > 0;

        if (pass === 0 && !hasExtractors) continue;
        if (pass === 1 && hasExtractors) continue;

        if (c.headers) {
          const newHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(c.headers)) {
            newHeaders[k] = replaceVariables(v, globalVars);
          }
          c.headers = newHeaders;
        }
        if (c.query) {
          const newQuery: Record<string, string> = {};
          for (const [k, v] of Object.entries(c.query)) {
            newQuery[k] = replaceVariables(v, globalVars);
          }
          c.query = newQuery;
        }
        if (typeof c.body === 'string') {
          c.body = replaceVariables(c.body, globalVars);
        }

        const r = await runOneCase(c, config, token);
        if (r.extractedVariables && Object.keys(r.extractedVariables).length > 0) {
          globalVars = { ...globalVars, ...r.extractedVariables };
        }
        caseResults[i] = r;

        if (!config.continueOnFail && r.status === 'failed') break;
      }
    }

    for (let i = 0; i < cases.length; i++) {
      if (!caseResults[i]) {
        caseResults[i] = {
          caseId: cases[i]!.id,
          status: 'canceled',
          startedAt,
          finishedAt: nowIso(),
          durationMs: 0,
          errorMessage: '已停止',
        };
      }
    }

    const summary = summarize(runId, startedAt, caseResults as CaseResult[]);
    const report: RunReport = {
      summary,
      config,
      cases,
      results: caseResults as CaseResult[],
    };

    await ensureReportsDir();
    const filePath = path.join(getReportsDir(), `${runId}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
    return report;
  }
}

router.post('/', async (req: Request, res: Response) => {
  const config = req.body?.config as RunConfig | undefined;
  const cases = req.body?.cases as CaseRequest[] | undefined;
  if (!config || typeof config.baseUrl !== 'string' || !config.baseUrl.trim()) {
    res.status(400).json({ success: false, error: 'config.baseUrl 不能为空' });
    return;
  }
  if (!cases || !Array.isArray(cases) || cases.length === 0) {
    res.status(400).json({ success: false, error: 'cases 不能为空' });
    return;
  }
  const normalized: RunConfig = {
    baseUrl: config.baseUrl.trim(),
    timeoutMs: typeof config.timeoutMs === 'number' && Number.isFinite(config.timeoutMs) ? config.timeoutMs : 15000,
    concurrency: typeof config.concurrency === 'number' && Number.isFinite(config.concurrency) ? config.concurrency : 1,
    continueOnFail: typeof config.continueOnFail === 'boolean' ? config.continueOnFail : true,
    auth: config.auth,
    extractedVariables: config.extractedVariables,
  };

  try {
    const report = await runAll(cases, normalized, config.extractedVariables);
    res.json({ success: true, data: report });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : '执行失败' });
  }
});

export default router;
