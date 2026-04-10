import { create } from 'zustand';
import type {
  PlaywrightCase,
  PlaywrightSuite,
  PlaywrightConfig,
  PlaywrightExecutionLog,
  ExecutionStatus,
} from '../../shared/playwrightCase';
import { apiJson, safeParseJsonAny } from '@/utils/http';

type ImportFormat = 'spec' | 'markdown' | 'auto';

type SettingsState = {
  browser: 'chromium' | 'firefox' | 'webkit';
  viewport: { width: number; height: number };
  slowMo: number;
  timeout: number;
  screenshotOnFailure: boolean;
  recordVideo: boolean;
  baseURL: string;
  baseURLEnabled: boolean;
  useCaseUrl: boolean;
};

type PlaywrightState = {
  loadedCases: PlaywrightCase[];
  executionQueue: string[];
  selectedIds: Record<string, boolean>;
  activeCaseId: string | null;
  isLoading: boolean;
  isExecuting: boolean;
  executingCaseId: string | null;
  executionLogs: PlaywrightExecutionLog[];
  currentExecutionLog: PlaywrightExecutionLog | null;
  settings: SettingsState;
  fileName: string | null;
  suiteName: string | null;
  error: string | null;

  importCases: (file: File, format?: ImportFormat) => Promise<void>;
  importCasesFromContent: (content: string, fileName: string) => Promise<void>;
  clearCases: () => void;
  setActiveCase: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  reorderCases: (fromIndex: number, toIndex: number) => void;
  moveCaseUp: (id: string) => void;
  moveCaseDown: (id: string) => void;
  updateCase: (id: string, updates: Partial<PlaywrightCase>) => void;
  deleteCase: (id: string) => void;
  setExecuting: (executing: boolean, caseId?: string | null) => void;
  setCurrentExecutionLog: (log: PlaywrightExecutionLog | null) => void;
  updateExecutionLogStatus: (caseId: string, status: ExecutionStatus) => void;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: SettingsState) => Promise<void>;
  setSettings: (patch: Partial<SettingsState>) => void;
  loadExecutionLogs: () => Promise<void>;
  getSelectedCases: () => PlaywrightCase[];
  getQueuedCases: () => PlaywrightCase[];
};

const defaultSettings: SettingsState = {
  browser: 'chromium',
  viewport: { width: 1920, height: 1080 },
  slowMo: 0,
  timeout: 30000,
  screenshotOnFailure: true,
  recordVideo: false,
  baseURL: 'http://localhost:3000',
  baseURLEnabled: false,
  useCaseUrl: false,
};

export const usePlaywrightStore = create<PlaywrightState>((set, get) => ({
  loadedCases: [],
  executionQueue: [],
  selectedIds: {},
  activeCaseId: null,
  isLoading: false,
  isExecuting: false,
  executingCaseId: null,
  executionLogs: [],
  currentExecutionLog: null,
  settings: defaultSettings,
  fileName: null,
  suiteName: null,
  error: null,

  importCases: async (file: File, format: ImportFormat = 'auto') => {
    try {
      set({ isLoading: true, error: null });
      const content = await file.text();
      const fileName = file.name;
      await get().importCasesFromContent(content, fileName);
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : '导入失败' });
    }
  },

  importCasesFromContent: async (content: string, fileName: string) => {
    try {
      set({ isLoading: true, error: null });
      const r = await apiJson<{
        success: boolean;
        data: {
          suite?: PlaywrightSuite;
          cases: PlaywrightCase[];
          errors?: string[];
        };
      }>('/api/playwright/cases/parse', {
        method: 'POST',
        body: JSON.stringify({ content, fileName }),
      });

      if (!r.success) {
        set({ isLoading: false, error: '解析失败' });
        return;
      }

      const { suite, cases, errors } = r.data;
      const loadedCases = cases.filter((c) => c.enabled);
      const queue = loadedCases.map((c) => c.id);

      set({
        loadedCases,
        executionQueue: queue,
        selectedIds: {},
        activeCaseId: loadedCases[0]?.id ?? null,
        fileName,
        suiteName: suite?.name ?? fileName,
        isLoading: false,
        error: errors && errors.length > 0 ? errors.join('；') : null,
      });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : '导入失败' });
    }
  },

  clearCases: () =>
    set({
      loadedCases: [],
      executionQueue: [],
      selectedIds: {},
      activeCaseId: null,
      fileName: null,
      suiteName: null,
      error: null,
    }),

  setActiveCase: (id) => set({ activeCaseId: id }),

  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: { ...s.selectedIds, [id]: !s.selectedIds[id] },
    })),

  selectAll: () =>
    set((s) => {
      const all: Record<string, boolean> = {};
      s.loadedCases.forEach((c) => {
        all[c.id] = true;
      });
      return { selectedIds: all };
    }),

  deselectAll: () => set({ selectedIds: {} }),

  reorderCases: (fromIndex: number, toIndex: number) =>
    set((s) => {
      const arr = [...s.executionQueue];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return { executionQueue: arr };
    }),

  moveCaseUp: (id: string) =>
    set((s) => {
      const index = s.executionQueue.indexOf(id);
      if (index <= 0) return s;
      const arr = [...s.executionQueue];
      const [item] = arr.splice(index, 1);
      arr.splice(index - 1, 0, item);
      return { executionQueue: arr };
    }),

  moveCaseDown: (id: string) =>
    set((s) => {
      const index = s.executionQueue.indexOf(id);
      if (index < 0 || index >= s.executionQueue.length - 1) return s;
      const arr = [...s.executionQueue];
      const [item] = arr.splice(index, 1);
      arr.splice(index + 1, 0, item);
      return { executionQueue: arr };
    }),

  updateCase: (id, updates) =>
    set((s) => ({
      loadedCases: s.loadedCases.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  deleteCase: (id) =>
    set((s) => {
      const newCases = s.loadedCases.filter((c) => c.id !== id);
      const newQueue = s.executionQueue.filter((qId) => qId !== id);
      const newSelected = { ...s.selectedIds };
      delete newSelected[id];
      return {
        loadedCases: newCases,
        executionQueue: newQueue,
        selectedIds: newSelected,
        activeCaseId: s.activeCaseId === id ? (newCases[0]?.id ?? null) : s.activeCaseId,
      };
    }),

  setExecuting: (executing, caseId = null) =>
    set({ isExecuting: executing, executingCaseId: caseId }),

  setCurrentExecutionLog: (log) => set({ currentExecutionLog: log }),

  updateExecutionLogStatus: (caseId, status) =>
    set((s) => {
      if (!s.currentExecutionLog) return s;
      const caseLog = s.currentExecutionLog.caseLogs.find((cl) => cl.caseId === caseId);
      if (caseLog) {
        caseLog.status = status;
      }
      return { currentExecutionLog: { ...s.currentExecutionLog } };
    }),

  loadSettings: async () => {
    try {
      const r = await apiJson<{ success: true; data: SettingsState }>('/api/playwright/settings');
      set({ settings: r.data });
    } catch {
      const local = localStorage.getItem('playwright_settings');
      if (local) {
        try {
          set({ settings: JSON.parse(local) });
        } catch {
          set({ settings: defaultSettings });
        }
      }
    }
  },

  saveSettings: async (settings) => {
    try {
      await apiJson('/api/playwright/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      set({ settings });
      localStorage.setItem('playwright_settings', JSON.stringify(settings));
    } catch {
      set({ settings });
      localStorage.setItem('playwright_settings', JSON.stringify(settings));
    }
  },

  setSettings: (patch) =>
    set((s) => ({
      settings: { ...s.settings, ...patch },
    })),

  loadExecutionLogs: async () => {
    try {
      const r = await apiJson<{ success: true; data: PlaywrightExecutionLog[] }>(
        '/api/playwright/logs'
      );
      set({ executionLogs: r.data });
    } catch {
      const local = localStorage.getItem('playwright_execution_logs');
      if (local) {
        try {
          set({ executionLogs: JSON.parse(local) });
        } catch {
          set({ executionLogs: [] });
        }
      }
    }
  },

  getSelectedCases: () => {
    const { loadedCases, selectedIds } = get();
    const selectedCaseIds = Object.entries(selectedIds)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return loadedCases.filter((c) => selectedCaseIds.includes(c.id));
  },

  getQueuedCases: () => {
    const { loadedCases, executionQueue } = get();
    return executionQueue
      .map((id) => loadedCases.find((c) => c.id === id))
      .filter((c): c is PlaywrightCase => c !== undefined);
  },
}));
