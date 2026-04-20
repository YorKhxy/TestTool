import { create } from 'zustand';
import type { ParsedTestPlan, TestCase } from '../../shared/testPlan.js';
import type { CaseRequest, RunConfig, RunReport } from '../../shared/runTypes.js';
import { apiJson, safeParseJsonAny } from '@/utils/http';

export type ExtractionRule = {
  id: string;
  name: string;
  path: string;
  source: 'body' | 'header';
  description?: string;
};

export type CaseOverride = {
  requiresAuth?: boolean;
  headersText: string;
  queryText: string;
  bodyText: string;
  expectedResult?: string;
  path?: string;
  variableExtractors?: { id: string; name: string; source: 'body' | 'header'; path: string }[];
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
  enableVariableReplace: boolean;
  authEmail: string;
  authPassword: string;
  mfaCode: string;
  aiApiUrl: string;
  aiApiKey: string;
  aiPrompt: string;
  aiModel: string;
};

type SettingsDto = {
  baseUrl: string;
  timeoutMs: number;
  concurrency: number;
  continueOnFail: boolean;
  enableVariableReplace: boolean;
  auth?: { email: string; password: string; mfaCode?: string };
  aiApiUrl?: string;
  aiApiKey?: string;
  aiPrompt?: string;
  aiModel?: string;
};

type RunnerState = {
  fileName: string | null;
  swaggerFileName: string | null;
  swaggerContent: object | null;
  parsed: ParsedTestPlan | null;
  selectedIds: Record<string, boolean>;
  overrides: Record<string, CaseOverride>;
  settings: SettingsState;
  activeCaseId: string | null;
  isRunning: boolean;
  lastReport: RunReport | null;
  error: string | null;
  isGenerating: boolean;
  markdownContent: string | null;
  uploadedDocuments: { name: string; path: string; content: string }[];
  uploadedZipName: string | null;
  extractedVariables: Record<string, string | number | boolean | object>;
  extractionRules: ExtractionRule[];

  loadSettings: () => Promise<void>;
  saveSettings: (s: SettingsState) => Promise<void>;
  setSettings: (patch: Partial<SettingsState>) => void;
  importMarkdown: (fileName: string, markdown: string) => Promise<void>;
  importSwagger: (fileName: string, swagger: object) => void;
  uploadDocumentsZip: (zipFileName: string) => Promise<void>;
  generateFromSwagger: () => Promise<void>;
  supplementCases: () => Promise<void>;
  saveMarkdown: (filePath: string) => Promise<void>;
  exportCases: (format: 'markdown' | 'excel') => Promise<void>;
  setActiveCase: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  setSelectMany: (ids: string[], selected: boolean) => void;
  clearSelection: () => void;
  updateOverride: (id: string, patch: Partial<CaseOverride>) => void;
  updateCaseExtractors: (id: string, extractors: { id: string; name: string; source: 'body' | 'header'; path: string }[]) => void;
  setExtractedVariables: (vars: Record<string, string | number | boolean | object>) => void;
  clearExtractedVariables: () => void;
  addExtractionRule: (rule: ExtractionRule) => void;
  removeExtractionRule: (id: string) => void;
  updateExtractionRule: (id: string, patch: Partial<Omit<ExtractionRule, 'id'>>) => void;
  clearExtractionRules: () => void;
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
  const cfg: RunConfig & { enableVariableReplace?: boolean } = {
    baseUrl: s.baseUrl.replace(/`/g, '').trim(),
    timeoutMs: s.timeoutMs,
    concurrency: s.concurrency,
    continueOnFail: s.continueOnFail,
    enableVariableReplace: s.enableVariableReplace,
  };
  if (s.authEmail && s.authPassword) {
    cfg.auth = {
      email: s.authEmail.replace(/`/g, '').trim(),
      password: s.authPassword.replace(/`/g, '').trim(),
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

function applyVariables(text: string, enableVariableReplace: boolean, email: string, password: string): string {
  if (!enableVariableReplace) return text;
  return interpolateVariables(text, email, password);
}

function applyExtractedVariables(text: string, vars: Record<string, string | number | boolean | object>): string {
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

function buildCaseRequests(
  cases: TestCase[],
  overrides: Record<string, CaseOverride>,
  settings: SettingsState,
  extractedVars: Record<string, string | number | boolean | object> = {}
) {
  const out: CaseRequest[] = [];
  const email = settings.authEmail || '';
  const password = settings.authPassword || '';
  const enableReplace = settings.enableVariableReplace;
  for (const c of cases) {
    const o = overrides[c.id];
    const headersRaw = applyVariables(o?.headersText ?? c.headersRaw ?? '{}', enableReplace, email, password);
    const queryRaw = applyVariables(o?.queryText ?? c.queryRaw ?? '{}', enableReplace, email, password);
    const headers = parseHeadersText(headersRaw);
    const query = parseQueryText(queryRaw);
    const rawBodyText = o?.bodyText ?? c.bodyRaw ?? '';
    const parsedBodyText = parseBodyText(rawBodyText);
    const bodyText = applyVariables(parsedBodyText, enableReplace, email, password);
    const body = safeParseJsonAny(bodyText);
    if ('error' in body) throw new Error(`${c.id} body：${body.error}`);

    const finalHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      finalHeaders[k] = applyExtractedVariables(v, extractedVars);
    }
    const finalQuery: Record<string, string> = {};
    for (const [k, v] of Object.entries(query)) {
      finalQuery[k] = applyExtractedVariables(v, extractedVars);
    }
    const finalBodyText = applyExtractedVariables(bodyText, extractedVars);
    const finalBody = safeParseJsonAny(finalBodyText);
    if (!finalBody.ok) {
      const parseError = 'error' in finalBody ? finalBody.error : '未知错误';
      throw new Error(`${c.id} body解析失败: ${parseError}`);
    }

    out.push({
      ...c,
      path: applyExtractedVariables(o?.path ?? c.path ?? '', extractedVars),
      expectedResult: applyExtractedVariables(o?.expectedResult ?? c.expectedResult ?? '', extractedVars),
      requiresAuth: typeof o?.requiresAuth === 'boolean' ? o?.requiresAuth : c.requiresAuth,
      headers: finalHeaders,
      query: finalQuery,
      body: finalBody.value,
      variableExtractors: o?.variableExtractors ?? c.variableExtractors,
    });
  }
  return out;
}

export const useRunnerStore = create<RunnerState>((set, get) => ({
  fileName: null,
  swaggerFileName: null,
  swaggerContent: null,
  parsed: null,
  selectedIds: {},
  overrides: {},
  settings: {
    baseUrl: '',
    timeoutMs: 15000,
    concurrency: 1,
    continueOnFail: true,
    enableVariableReplace: false,
    authEmail: '',
    authPassword: '',
    mfaCode: '',
    aiApiUrl: '',
    aiApiKey: '',
    aiPrompt: '',
    aiModel: 'gpt-4',
  },
  activeCaseId: null,
  isRunning: false,
  lastReport: null,
  error: null,
  isGenerating: false,
  markdownContent: null,
  uploadedDocuments: [],
  uploadedZipName: null,
  extractedVariables: {},
  extractionRules: [],

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
          enableVariableReplace: typeof r.data.enableVariableReplace === 'boolean' ? r.data.enableVariableReplace : s.settings.enableVariableReplace,
          authEmail: (r.data.auth?.email || s.settings.authEmail || '').replace(/`/g, '').trim(),
          authPassword: (r.data.auth?.password || s.settings.authPassword || '').replace(/`/g, '').trim(),
          mfaCode: r.data.auth?.mfaCode || s.settings.mfaCode,
          aiApiUrl: r.data.aiApiUrl || s.settings.aiApiUrl || '',
          aiApiKey: r.data.aiApiKey || s.settings.aiApiKey || '',
          aiPrompt: r.data.aiPrompt || s.settings.aiPrompt || '',
          aiModel: r.data.aiModel || s.settings.aiModel || 'gpt-4',
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
        body: JSON.stringify({
          ...buildRunConfig(s2),
          aiApiUrl: s2.aiApiUrl,
          aiApiKey: s2.aiApiKey,
          aiPrompt: s2.aiPrompt,
          aiModel: s2.aiModel,
        }),
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

      const allRules: ExtractionRule[] = [];
      for (const c of parsed.cases) {
        if (c.variableExtractors && c.variableExtractors.length > 0) {
          for (const ex of c.variableExtractors) {
            if (!allRules.some((r) => r.id === ex.id)) {
              allRules.push({
                id: ex.id,
                name: ex.name,
                path: ex.path,
                source: ex.source,
              });
            }
          }
        }
      }

      set((s) => ({
        fileName,
        parsed,
        markdownContent: markdown,
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
        extractionRules: allRules,
      }));
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '导入失败' });
    }
  },

  importSwagger: (fileName: string, swagger: object) => {
    set({ swaggerFileName: fileName, swaggerContent: swagger });
  },

  uploadDocumentsZip: async (zipFileName: string) => {
    try {
      set({ isGenerating: true, error: null });
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"][accept*=".zip"]');
      const file = fileInput?.files?.[0];
      if (!file) {
        set({ isGenerating: false, error: '请先选择 ZIP 文件' });
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/generate/upload-zip', {
        method: 'POST',
        body: formData,
      });
      const r = await response.json() as { success: boolean; documents?: { name: string; path: string; content: string }[]; error?: string };
      if (!r.success || !r.documents) {
        set({ isGenerating: false, error: r.error || '上传失败' });
        return;
      }
      set({ uploadedDocuments: r.documents, uploadedZipName: zipFileName, isGenerating: false });
    } catch (e: unknown) {
      set({ isGenerating: false, error: e instanceof Error ? e.message : '上传失败' });
    }
  },

  generateFromSwagger: async () => {
    const { swaggerContent, uploadedDocuments, uploadedZipName } = get();
    if (!swaggerContent && uploadedDocuments.length === 0) {
      set({ error: '请先上传 Swagger 文件或用例文档压缩包' });
      return;
    }
    try {
      set({ isGenerating: true, error: null });
      const r = await apiJson<{ success: true; data: string }>('/api/generate/ai-generate', {
        method: 'POST',
        body: JSON.stringify({
          swagger: swaggerContent,
          documents: uploadedDocuments.length > 0 ? uploadedDocuments : undefined,
        }),
      });
      const markdown = r.data;
      await get().importMarkdown(uploadedZipName ?? 'AI生成的测试用例.md', markdown);
      set({ swaggerFileName: null, isGenerating: false });
    } catch (e: unknown) {
      set({ isGenerating: false, error: e instanceof Error ? e.message : 'AI 生成失败' });
    }
  },

  supplementCases: async () => {
    const { swaggerContent, uploadedDocuments, parsed } = get();
    if (!swaggerContent && uploadedDocuments.length === 0) {
      set({ error: '请先上传 Swagger 文件或用例文档压缩包' });
      return;
    }
    if (!parsed || parsed.cases.length === 0) {
      set({ error: '请先生成初始用例' });
      return;
    }
    try {
      set({ isGenerating: true, error: null });
      const existingCasesText = parsed.cases
        .map((c) => `${c.id} | ${c.title} | ${c.method} | ${c.path}`)
        .join('\n');
      const r = await apiJson<{ success: true; data: string }>('/api/generate/ai-generate', {
        method: 'POST',
        body: JSON.stringify({
          swagger: swaggerContent,
          documents: uploadedDocuments.length > 0 ? uploadedDocuments : undefined,
          existingCases: existingCasesText,
        }),
      });
      const newMarkdown = r.data;
      const newParsed = await apiJson<{ success: true; data: ParsedTestPlan }>('/api/testplan/parse', {
        method: 'POST',
        body: JSON.stringify({ markdown: newMarkdown }),
      });
      set((s) => {
        const combinedMarkdown = s.markdownContent
          ? s.markdownContent + '\n\n' + newMarkdown
          : newMarkdown;
        return {
          parsed: { ...s.parsed!, cases: [...(s.parsed?.cases ?? []), ...newParsed.data.cases] },
          markdownContent: combinedMarkdown,
          isGenerating: false,
          error: null,
        };
      });
    } catch (e: unknown) {
      console.error('Supplement error:', e);
      set({ isGenerating: false, error: e instanceof Error ? e.message : 'AI 补充用例失败' });
    }
  },

  saveMarkdown: async (filePath: string, format: 'markdown' | 'excel' = 'markdown') => {
    const { parsed, overrides } = get();
    if (!parsed || parsed.cases.length === 0) {
      set({ error: '没有可保存的用例内容，请先生成用例' });
      return;
    }
    try {
      const r = await apiJson<{ success: boolean; path?: string; error?: string }>('/api/testplan/save', {
        method: 'POST',
        body: JSON.stringify({ filePath, format, cases: parsed.cases, overrides }),
      });
      if (!r.success) {
        set({ error: r.error || '保存失败' });
      }
    } catch (e: unknown) {
      console.error('Save error:', e);
      set({ error: e instanceof Error ? e.message : '保存失败' });
    }
  },

  exportCases: async (format: 'markdown' | 'excel') => {
    const { parsed, overrides } = get();
    console.log('exportCases called', { format, parsedCases: parsed?.cases.length, overridesCount: Object.keys(overrides).length });
    if (!parsed || parsed.cases.length === 0) {
      const msg = '没有可导出的用例';
      set({ error: msg });
      alert(msg);
      return;
    }
    try {
      console.log('Sending export request...');
      const response = await fetch('/api/testplan/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          cases: parsed.cases,
          overrides,
          meta: parsed.meta,
          rawMarkdown: parsed.rawMarkdown ?? undefined,
        }),
      });
      console.log('Export response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export failed:', errorText);
        set({ error: '导出失败: ' + errorText });
        alert('导出失败: ' + errorText);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `testcases_export_${Date.now()}.${format === 'markdown' ? 'md' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      console.error('Export error:', e);
      const errorMsg = e instanceof Error ? e.message : '导出失败';
      set({ error: errorMsg });
      alert('导出失败: ' + errorMsg);
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

  updateCaseExtractors: (id, extractors) =>
    set((s) => {
      const existing = s.overrides[id];
      const markdownDefaults = s.parsed?.cases.find((c) => c.id === id);
      const base = existing ?? {
        headersText: markdownDefaults?.headersRaw ?? '{}',
        queryText: markdownDefaults?.queryRaw ?? '{}',
        bodyText: markdownDefaults?.bodyRaw ?? '',
      };
      const currentExtractors = base.variableExtractors ?? [];
      const existingIds = new Set(currentExtractors.map((e) => e.id));
      const newExtractors = extractors.filter((e) => !existingIds.has(e.id));
      return {
        overrides: {
          ...s.overrides,
          [id]: { ...base, variableExtractors: [...currentExtractors, ...newExtractors] },
        },
      };
    }),

  setExtractedVariables: (vars) =>
    set((s) => ({
      extractedVariables: { ...s.extractedVariables, ...vars },
    })),

  clearExtractedVariables: () => set({ extractedVariables: {} }),

  addExtractionRule: (rule) =>
    set((s) => {
      const existsById = s.extractionRules.some((r) => r.id === rule.id);
      const existsByName = s.extractionRules.some((r) => r.name === rule.name);
      if (existsById || existsByName) return s;
      return { extractionRules: [...s.extractionRules, rule] };
    }),

  removeExtractionRule: (id) =>
    set((s) => ({
      extractionRules: s.extractionRules.filter((r) => r.id !== id),
    })),

  updateExtractionRule: (id, patch) =>
    set((s) => ({
      extractionRules: s.extractionRules.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    })),

  clearExtractionRules: () => set({ extractionRules: [] }),

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
      const extractedVars = get().extractedVariables;
      const caseReqs = buildCaseRequests(selected, get().overrides, get().settings, extractedVars);
      const configWithVars = { ...buildRunConfig(s), extractedVariables: extractedVars };
      const r = await apiJson<{ success: true; data: RunReport }>('/api/runs', {
        method: 'POST',
        body: JSON.stringify({ config: configWithVars, cases: caseReqs }),
      });
      const allVars: Record<string, string | number | boolean | object> = {};
      for (const result of r.data.results) {
        if (result.extractedVariables) {
          Object.assign(allVars, result.extractedVariables);
        }
      }
      set((prev) => ({
        lastReport: r.data,
        isRunning: false,
        extractedVariables: { ...prev.extractedVariables, ...allVars },
      }));
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
      const extractedVars = get().extractedVariables;
      const caseReqs = buildCaseRequests(selected, get().overrides, get().settings, extractedVars);
      const configWithVars = { ...buildRunConfig(s), extractedVariables: extractedVars };
      const r = await apiJson<{ success: true; data: RunReport }>('/api/runs', {
        method: 'POST',
        body: JSON.stringify({ config: configWithVars, cases: caseReqs }),
      });
      const allVars: Record<string, string | number | boolean | object> = {};
      for (const result of r.data.results) {
        if (result.extractedVariables) {
          Object.assign(allVars, result.extractedVariables);
        }
      }
      set((prev) => ({
        lastReport: r.data,
        isRunning: false,
        extractedVariables: { ...prev.extractedVariables, ...allVars },
      }));
    } catch (e: unknown) {
      set({ isRunning: false, error: e instanceof Error ? e.message : '执行失败' });
    }
  },
}));
