import type { PlaywrightStepType, PlaywrightCase, PlaywrightSuite } from './playwrightCase.ts';

export type StepResultStatus = 'passed' | 'failed' | 'skipped' | 'running';

export type StepResult = {
  stepId: string;
  stepType: PlaywrightStepType;
  status: StepResultStatus;
  durationMs: number;
  screenshot?: string;
  errorMessage?: string;
  extractedVars?: Record<string, string>;
  httpStatus?: number;
  responsePreview?: string;
};

export type CaseResult = {
  caseId: string;
  caseTitle: string;
  status: 'passed' | 'failed' | 'skipped' | 'running' | 'canceled';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  stepResults: StepResult[];
  errorMessage?: string;
  videoPath?: string;
};

export type PlaywrightRunSummary = {
  runId: string;
  suiteId: string;
  startedAt: string;
  finishedAt?: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  canceled: number;
  durationMs?: number;
};

export type PlaywrightRunReport = {
  runId: string;
  suiteId: string;
  suiteName: string;
  startedAt: string;
  finishedAt?: string;
  summary: PlaywrightRunSummary;
  caseResults: CaseResult[];
  config: PlaywrightRunConfig;
};

export type PlaywrightRunConfig = {
  browser: 'chromium' | 'firefox' | 'webkit';
  viewport: { width: number; height: number };
  slowMo: number;
  timeout: number;
  screenshotOnFailure: boolean;
  recordVideo: boolean;
  baseURL: string;
  concurrency: number;
  continueOnFail: boolean;
  auth?: {
    email: string;
    password: string;
  };
  extractedVariables?: Record<string, string | number | boolean | object>;
};

export type PlaywrightRunRequest = {
  suite: PlaywrightSuite;
  config: PlaywrightRunConfig;
  caseIds?: string[];
};

export type ExecutionLog = {
  runId: string;
  caseId: string;
  stepIndex: number;
  type: 'start' | 'step' | 'log' | 'screenshot' | 'error' | 'complete' | 'case_complete';
  message?: string;
  screenshot?: string;
  data?: Record<string, unknown>;
  timestamp: string;
};
