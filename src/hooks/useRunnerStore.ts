import { create } from 'zustand';
import type { ParsedTestPlan, TestCase } from '../../shared/testPlan.js';
import type { CaseRequest, RunConfig, RunReport } from '../../shared/runTypes.js';
import { apiJson, safeParseJsonAny } from '@/utils/http';

type CaseOverride = {
  requiresAuth?: boolean;
  enableVariableReplace?: boolean;
  headersText: string;
  queryText: string;
  bodyText: string;
};

function parseBodyText(text: string): string {
  const t = text.trim();
  if (!t || t === '-') return '';
  let result = t;
  if (result.startsWith('`') && result.endsWith('`')) {
    result = result.slice(1, -1);
  }
  return result;
}

function parseHeadersText(text: string): Record<string, string> {
  const t = text.trim();
  if (!t || t === '{}' || t === '-') return {};
  if (t.startsWith('{')) {
    try {
      return JSON.parse(t);
    } catch {
      return {};
    }
  }
  const result: Record<string, string> = {};
  const parts = t.split(';');
  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx > 0) {
      const key = part.substring(0, idx).trim();
      const val = part.substring(idx + 1).trim();
      if (key) result[key] = val;
    }
  }
  return result;
}

function parseQueryText(text: string): Record<string, string> {
  const t = text.trim();
  if (!t || t === '{}' || t === '-') return {};
  if (t.startsWith('{')) {
    try {
      return JSON.parse(t);
    } catch {
      return {};
    }
  }
  const result: Record<string, string> = {};
  const parts = t.split('&');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.substring(0, idx).trim();
      const val = part.substring(idx + 1).trim();
      if (key) result[key] = val;
    }
  }
  return result;
}

type SettingsState = {
  baseUrl: string;
  timeoutMs: number;
  concurrency: number;
  continueOnFail: boolean;
  authEmail: string;
  authPassword: string;
  mfaCode: string;
};

type SettingsDto = {
  baseUrl: string;
  timeoutMs: number;
  concurrency: number;
  continueOnFail: boolean;
  auth?: { email: string; password: string; mfaCode?: string };
};

type RunnerState = {
  fileName: string | null;
  parsed: ParsedTestPlan | null;
  selectedIds: Record<string, boolean>;
  overrides: Record<string, CaseOverride>;
  settings: SettingsState;
  activeCaseId: string | null;
  isRunning: boolean;
  lastReport: RunReport | null;
  error: string | null;

  loadSettings: () => Promise<void>;
  saveSettings: (s: SettingsState) => Promise<void>;
  setSettings: (patch: Partial<SettingsState>) => void;
  importMarkdown: (fileName: string, markdown: string) => Promise<void>;
  setActiveCase: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  setSelectMany: (ids: string[], selected: boolean) => void;
  clearSelection: () => void;
  updateOverride: (id: string, patch: Partial<CaseOverride>) => void;
  runSelected: () => Promise<void>;
  runSingle: (id: string) => Promise<void>;
};

function inferSettingsFromMeta(meta: ParsedTestPlan['meta']): Partial<SettingsState> {
  const baseUrl = (meta.envUrl || meta.baseUrl || '').trim();
  const authEmail = (meta.adminEmail || '').trim();
  const authPassword = (meta.adminPassword || '').trim();
  return { baseUrl, authEmail, authPassword };
}

function normalizeSettings(s: SettingsState): SettingsState {
  return {
    ...s,
    baseUrl: s.baseUrl.replace(/`/g, '').trim(),
    authEmail: s.authEmail.replace(/`/g, '').trim(),
    authPassword: s.authPassword.replace(/`/g, '').trim(),
    timeoutMs: Math.max(1000, Math.floor(s.timeoutMs)),
    concurrency: Math.max(1, Math.min(10, Math.floor(s.concurrency))),
  };
}

function buildRunConfig(s: SettingsState): RunConfig {
  const cfg: RunConfig = {
    baseUrl: s.baseUrl.trim(),
    timeoutMs: s.timeoutMs,
    concurrency: s.concurrency,
    continueOnFail: s.continueOnFail,
  };
  if (s.authEmail && s.authPassword) {
    cfg.auth = {
      email: s.authEmail,
      password: s.authPassword,
      mfaCode: s.mfaCode || undefined,
    };
  }
  return cfg;
}

function interpolateVariables(text: string, email: string, password: string): string {
  return text
    .replace(/\{\{\s*auth\.email\s*\}\}/g, email)
    .replace(/\{\{\s*auth\.password\s*\}\}/g, password);
}

function buildCaseRequests(cases: TestCase[], overrides: Record<string, CaseOverride>, settings: SettingsState) {
  const out: CaseRequest[] = [];
  const email = settings.authEmail || '';
  const password = settings.authPassword || '';
  for (const c of cases) {
    const o = overrides[c.id];
    const headers = parseHeadersText(o?.headersText ?? c.headersRaw ?? '{}');
    const query = parseQueryText(o?.queryText ?? c.queryRaw ?? '{}');
    const rawBodyText = o?.bodyText ?? c.bodyRaw ?? '';
    const parsedBodyText = parseBodyText(rawBodyText);
    const bodyText = o?.enableVariableReplace ? interpolateVariables(parsedBodyText, email, password) : parsedBodyText;
    const body = safeParseJsonAny(bodyText);
    if ('error' in body) throw new Error(`${c.id} body：${body.error}`);

    out.push({
      ...c,
      requiresAuth: typeof o?.requiresAuth === 'boolean' ? o.requiresAuth : c.requiresAuth,
      headers,
      query,
      body: body.value,
    });
  }
  return out;
}

export const useRunnerStore = create<RunnerState>((set, get) => ({
  fileName: null,
  parsed: null,
  selectedIds: {},
  overrides: {},
  settings: {
    baseUrl: '',
    timeoutMs: 15000,
    concurrency: 1,
    continueOnFail: true,
    authEmail: '',
    authPassword: '',
    mfaCode: '',
  },
  activeCaseId: null,
  isRunning: false,
  lastReport: null,
  error: null,

  loadSettings: async () => {
    try {
      const r = await apiJson<{ success: true; data: SettingsDto }>('/api/settings');
      set((s) => ({
        settings: normalizeSettings({
          ...s.settings,
          baseUrl: (r.data.baseUrl || s.settings.baseUrl || '').replace(/`/g, '').trim(),
          timeoutMs: r.data.timeoutMs || s.settings.timeoutMs,
          concurrency: r.data.concurrency || s.settings.concurrency,
          continueOnFail: typeof r.data.continueOnFail === 'boolean' ? r.data.continueOnFail : s.settings.continueOnFail,
          authEmail: (r.data.auth?.email || s.settings.authEmail || '').replace(/`/g, '').trim(),
          authPassword: (r.data.auth?.password || s.settings.authPassword || '').replace(/`/g, '').trim(),
          mfaCode: r.data.auth?.mfaCode || s.settings.mfaCode,
        }),
      }));
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '加载设置失败' });
    }
  },

  setSettings: (patch) =>
    set((s) => ({
      settings: normalizeSettings({ ...s.settings, ...patch }),
    })),

  saveSettings: async (s: SettingsState) => {
    const s2 = normalizeSettings(s);
    if (!s2.baseUrl) {
      set({ error: 'Base URL 不能为空' });
      return;
    }
    try {
      await apiJson('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(buildRunConfig(s2)),
      });
      set({ settings: s2, error: null });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '保存设置失败' });
    }
  },

  importMarkdown: async (fileName: string, markdown: string) => {
    try {
      const r = await apiJson<{ success: true; data: ParsedTestPlan }>('/api/testplan/parse', {
        method: 'POST',
        body: JSON.stringify({ markdown }),
      });
      const parsed = r.data;
      const inferred = inferSettingsFromMeta(parsed.meta);

      set((s) => ({
        fileName,
        parsed,
        selectedIds: {},
        overrides: {},
        activeCaseId: parsed.cases[0]?.id ?? null,
        lastReport: null,
        error: parsed.warnings.length ? parsed.warnings.join('；') : null,
        settings: normalizeSettings({
          ...s.settings,
          baseUrl: s.settings.baseUrl || inferred.baseUrl || '',
          authEmail: s.settings.authEmail || inferred.authEmail || '',
          authPassword: s.settings.authPassword || inferred.authPassword || '',
        }),
      }));
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '导入失败' });
    }
  },

  setActiveCase: (id) => set({ activeCaseId: id }),

  toggleSelect: (id) =>
    set((s) => ({ selectedIds: { ...s.selectedIds, [id]: !s.selectedIds[id] } })),

  setSelectMany: (ids, selected) =>
    set((s) => {
      const next = { ...s.selectedIds };
      for (const id of ids) next[id] = selected;
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: {} }),

  updateOverride: (id, patch) =>
    set((s) => {
      const existing = s.overrides[id];
      const markdownDefaults = s.parsed?.cases.find((c) => c.id === id);
      const base = existing ?? {
        headersText: markdownDefaults?.headersRaw ?? '{}',
        queryText: markdownDefaults?.queryRaw ?? '{}',
        bodyText: markdownDefaults?.bodyRaw ?? '',
      };
      return {
        overrides: {
          ...s.overrides,
          [id]: { ...base, ...patch },
        },
      };
    }),

  runSelected: async () => {
    const parsed = get().parsed;
    if (!parsed) {
      set({ error: '请先导入Markdown' });
      return;
    }
    const ids = Object.entries(get().selectedIds)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (ids.length === 0) {
      set({ error: '请选择至少一条用例' });
      return;
    }
    const selected = parsed.cases.filter((c) => ids.includes(c.id));
    if (selected.length === 0) {
      set({ error: '没有可执行的用例' });
      return;
    }

    const s = normalizeSettings(get().settings);
    if (!s.baseUrl) {
      set({ error: '请先在设置里配置 Base URL' });
      return;
    }

    try {
      set({ isRunning: true, error: null });
      const caseReqs = buildCaseRequests(selected, get().overrides, get().settings);
      const r = await apiJson<{ success: true; data: RunReport }>('/api/runs', {
        method: 'POST',
        body: JSON.stringify({ config: buildRunConfig(s), cases: caseReqs }),
      });
      set({ lastReport: r.data, isRunning: false });
    } catch (e: unknown) {
      set({ isRunning: false, error: e instanceof Error ? e.message : '执行失败' });
    }
  },

  runSingle: async (id: string) => {
    const parsed = get().parsed;
    if (!parsed) {
      set({ error: '请先导入Markdown' });
      return;
    }
    const selected = parsed.cases.filter((c) => c.id === id);
    if (selected.length === 0) {
      set({ error: '没有可执行的用例' });
      return;
    }

    const s = normalizeSettings(get().settings);
    if (!s.baseUrl) {
      set({ error: '请先在设置里配置 Base URL' });
      return;
    }

    try {
      set({ isRunning: true, error: null });
      const caseReqs = buildCaseRequests(selected, get().overrides, get().settings);
      const r = await apiJson<{ success: true; data: RunReport }>('/api/runs', {
        method: 'POST',
        body: JSON.stringify({ config: buildRunConfig(s), cases: caseReqs }),
      });
      set({ lastReport: r.data, isRunning: false });
    } catch (e: unknown) {
      set({ isRunning: false, error: e instanceof Error ? e.message : '执行失败' });
    }
  },
}));
