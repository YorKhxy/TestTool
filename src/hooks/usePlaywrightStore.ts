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

type ProgressEvent = {
  type: 'case_start' | 'case_end' | 'step_start' | 'step_end' | 'complete' | 'error' | 'paused' | 'resumed';
  runId: string;
  caseId?: string;
  caseTitle?: string;
  stepId?: string;
  stepIndex?: number;
  stepType?: string;
  stepDescription?: string;
  status?: 'passed' | 'failed' | 'running' | 'pending';
  error?: string;
  caseStatus?: 'passed' | 'failed' | 'running' | 'canceled' | 'skipped';
  data?: Record<string, unknown>;
};

let eventSource: EventSource | null = null;

type SettingsState = {
  browser: 'chromium' | 'firefox' | 'webkit';
  viewport: { width: number; height: number };
  slowMo: number;
  timeout: number;
  screenshotOnFailure: boolean;
  recordVideo: boolean;
  headless: boolean;
  baseURL: string;
  baseURLEnabled: boolean;
  useCaseUrl: boolean;
};

type ProgressState = {
  runId: string | null;
  currentCaseId: string | null;
  currentCaseTitle: string | null;
  currentStepIndex: number | null;
  currentStepType: string | null;
  currentStepDescription: string | null;
  caseStatuses: Record<string, 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'canceled'>;
  stepStatuses: Record<string, Record<number, 'pending' | 'running' | 'passed' | 'failed'>>;
};

type PlaywrightState = {
  loadedCases: PlaywrightCase[];
  executionQueue: string[];
  selectedIds: Record<string, boolean>;
  activeCaseId: string | null;
  isLoading: boolean;
  isExecuting: boolean;
  isPaused: boolean;
  executingCaseId: string | null;
  caseStatuses: Record<string, 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'canceled'>;
  executionLogs: PlaywrightExecutionLog[];
  currentExecutionLog: PlaywrightExecutionLog | null;
  settings: SettingsState;
  fileName: string | null;
  suiteName: string | null;
  error: string | null;
  progressState: ProgressState;

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
  runCases: (caseIds: string[]) => Promise<void>;
  cancelRun: () => Promise<void>;
  pauseExecution: () => Promise<void>;
  resumeExecution: () => Promise<void>;
  connectSSE: () => void;
  disconnectSSE: () => void;
};

const defaultSettings: SettingsState = {
  browser: 'chromium',
  viewport: { width: 1920, height: 1080 },
  slowMo: 0,
  timeout: 30000,
  screenshotOnFailure: true,
  recordVideo: false,
  headless: true,
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
  isPaused: false,
  executingCaseId: null,
  caseStatuses: {},
  executionLogs: [],
  currentExecutionLog: null,
  settings: defaultSettings,
  fileName: null,
  suiteName: null,
  error: null,
  progressState: {
    runId: null,
    currentCaseId: null,
    currentCaseTitle: null,
    currentStepIndex: null,
    currentStepType: null,
    currentStepDescription: null,
    caseStatuses: {},
    stepStatuses: {},
  },

  importCases: async (file: File, _format?: ImportFormat) => {
    set({
      isLoading: true,
      error: null,
      loadedCases: [],
      executionQueue: [],
      selectedIds: {},
      activeCaseId: null,
      fileName: null,
      suiteName: null,
    });

    try {
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
        caseStatuses: {},
        executionLogs: [],
        currentExecutionLog: null,
        progressState: {
          runId: null,
          currentCaseId: null,
          currentCaseTitle: null,
          currentStepIndex: null,
          currentStepType: null,
          currentStepDescription: null,
          caseStatuses: {},
          stepStatuses: {},
        },
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
    const { loadedCases, executionQueue, selectedIds } = get();
    const selectedCaseIds = Object.entries(selectedIds)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return executionQueue
      .filter((id) => selectedCaseIds.includes(id))
      .map((id) => loadedCases.find((c) => c.id === id))
      .filter((c): c is PlaywrightCase => c !== undefined);
  },

  getQueuedCases: () => {
    const { loadedCases, executionQueue } = get();
    return executionQueue
      .map((id) => loadedCases.find((c) => c.id === id))
      .filter((c): c is PlaywrightCase => c !== undefined);
  },

  runCases: async (caseIds: string[]) => {
    const { loadedCases, settings, connectSSE } = get();
    const casesToRun = caseIds
      .map((id) => loadedCases.find((c) => c.id === id))
      .filter((c): c is PlaywrightCase => c !== undefined);

    if (casesToRun.length === 0) {
      set({ error: '没有可执行的用例' });
      return;
    }

    const runId = `run_${Date.now()}`;
    const initialStatuses: Record<string, 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'canceled'> = {};
    const initialStepStatuses: Record<string, Record<number, 'pending' | 'running' | 'passed' | 'failed'>> = {};

    casesToRun.forEach((c) => {
      initialStatuses[c.id] = 'pending';
      initialStepStatuses[c.id] = {};
      c.steps?.forEach((_, idx) => {
        initialStepStatuses[c.id][idx] = 'pending';
      });
    });

    set({
      isExecuting: true,
      error: null,
      executingCaseId: caseIds[0] || null,
      caseStatuses: initialStatuses,
      progressState: {
        runId,
        currentCaseId: casesToRun[0]?.id || null,
        currentCaseTitle: casesToRun[0]?.title || null,
        currentStepIndex: null,
        currentStepType: null,
        currentStepDescription: null,
        caseStatuses: initialStatuses,
        stepStatuses: initialStepStatuses,
      },
    });

    connectSSE();

    try {
      const cases = casesToRun.map((c) => {
        let url: string | undefined;
        if (settings.useCaseUrl && c.url) {
          url = c.url;
        } else if (settings.baseURLEnabled) {
          url = settings.baseURL;
        }
        return { ...c, url };
      });

      const r = await apiJson<{
        success: boolean;
        data?: PlaywrightExecutionLog;
        error?: string;
      }>('/api/playwright/run', {
        method: 'POST',
        body: JSON.stringify({ cases, settings }),
      });

      if (r.success && r.data) {
        set({ currentExecutionLog: r.data });
      } else {
        set({ error: r.error || '执行失败' });
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '执行失败' });
    } finally {
      set({ isExecuting: false, executingCaseId: null });
    }
  },

  connectSSE: () => {
    if (eventSource) {
      eventSource.close();
    }

    const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
    eventSource = new EventSource(`${baseURL}/api/playwright/run/events`);

    eventSource.addEventListener('progress', (e: MessageEvent) => {
      try {
        const event: ProgressEvent = JSON.parse(e.data);

        switch (event.type) {
          case 'case_start':
            set((state) => ({
              progressState: {
                ...state.progressState,
                currentCaseId: event.caseId || null,
                currentCaseTitle: event.caseTitle || null,
                caseStatuses: {
                  ...state.progressState.caseStatuses,
                  [event.caseId || '']: 'running',
                },
              },
              caseStatuses: {
                ...state.caseStatuses,
                [event.caseId || '']: 'running',
              },
            }));
            break;

          case 'step_start':
            set((state) => ({
              progressState: {
                ...state.progressState,
                currentStepIndex: event.stepIndex ?? null,
                currentStepType: event.stepType || null,
                currentStepDescription: event.stepDescription || null,
                stepStatuses: {
                  ...state.progressState.stepStatuses,
                  [event.caseId || '']: {
                    ...state.progressState.stepStatuses[event.caseId || ''],
                    [event.stepIndex ?? 0]: 'running',
                  },
                },
              },
            }));
            break;

          case 'step_end':
            if (event.caseId && event.stepIndex !== undefined) {
              set((state) => ({
                progressState: {
                  ...state.progressState,
                  currentStepIndex: null,
                  stepStatuses: {
                    ...state.progressState.stepStatuses,
                    [event.caseId]: {
                      ...state.progressState.stepStatuses[event.caseId],
                      [event.stepIndex]: event.status as 'passed' | 'failed',
                    },
                  },
                },
              }));
            }
            break;

          case 'case_end':
            if (event.caseId) {
              set((state) => ({
                progressState: {
                  ...state.progressState,
                  caseStatuses: {
                    ...state.progressState.caseStatuses,
                    [event.caseId]: event.caseStatus as 'passed' | 'failed' | 'skipped' | 'canceled',
                  },
                },
                caseStatuses: {
                  ...state.caseStatuses,
                  [event.caseId]: event.caseStatus as 'passed' | 'failed' | 'skipped' | 'canceled',
                },
                executingCaseId: state.executingCaseId === event.caseId ? null : state.executingCaseId,
              }));
            }
            break;

          case 'paused':
            set({ isPaused: true });
            break;

          case 'resumed':
            set({ isPaused: false });
            break;

          case 'complete':
          case 'error':
            set({
              isExecuting: false,
              isPaused: false,
              executingCaseId: null,
            });
            void get().loadExecutionLogs();
            break;
        }
      } catch {
      }
    });

    eventSource.addEventListener('error', () => {
      eventSource?.close();
      eventSource = null;
    });
  },

  disconnectSSE: () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  },

  cancelRun: async () => {
    try {
      await apiJson('/api/playwright/run/cancel', {
        method: 'POST',
      });
      set({ isExecuting: false, isPaused: false, executingCaseId: null, error: '已取消执行' });
    } catch {
      set({ isExecuting: false, isPaused: false, executingCaseId: null });
    }
  },

  pauseExecution: async () => {
    try {
      await apiJson('/api/playwright/run/pause', {
        method: 'POST',
      });
      set({ isPaused: true });
    } catch {
      console.error('Pause failed');
    }
  },

  resumeExecution: async () => {
    try {
      await apiJson('/api/playwright/run/resume', {
        method: 'POST',
      });
      set({ isPaused: false });
    } catch {
      console.error('Resume failed');
    }
  },
}));
