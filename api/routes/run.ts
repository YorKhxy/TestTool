import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { CaseRequest, CaseResult, RunConfig, RunReport, RunSummary } from '../../shared/runTypes.js';

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
  const t = text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
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
    throw new Error(`登录响应不是JSON：${safePreview(text)}`);
  }
  throw new Error(`登录响应未包含 token：${safePreview(text)}`);
}

function shouldPassByBody(responseJson: unknown): boolean | null {
  if (!isRecord(responseJson)) return null;
  if (!('code' in responseJson)) return null;
  const code = responseJson.code;
  if (typeof code !== 'number') return null;
  return code === 0;
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
    const needsAuth = c.requiresAuth !== false;
    if (needsAuth && token) headers.authorization = `Bearer ${token}`;

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

    let status: CaseResult['status'] = res.ok ? 'passed' : 'failed';
    if (res.ok) {
      try {
        const json = JSON.parse(text);
        const byBody = shouldPassByBody(json);
        if (byBody !== null) status = byBody ? 'passed' : 'failed';
      } catch {
        void 0;
      }
    }

    return {
      caseId: c.id,
      status,
      startedAt,
      finishedAt,
      durationMs,
      httpStatus: res.status,
      responseBodyPreview: safePreview(text),
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

async function runAll(cases: CaseRequest[], config: RunConfig) {
  const startedAt = nowIso();
  const runId = makeRunId();

  const needAuth = cases.some((c) => c.requiresAuth !== false);
  const token = needAuth && config.auth ? await login(config.baseUrl, config.auth, config.timeoutMs) : null;

  const results: CaseResult[] = [];
  const concurrency = Math.max(1, Math.min(10, Math.floor(config.concurrency || 1)));

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
  };

  try {
    const report = await runAll(cases, normalized);
    res.json({ success: true, data: report });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : '执行失败' });
  }
});

export default router;
