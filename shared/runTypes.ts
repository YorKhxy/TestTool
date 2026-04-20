import type { TestCase } from './testPlan.js';

export type CaseResultStatus = 'passed' | 'failed' | 'skipped' | 'running' | 'canceled';

export type VariableExtractorSource = 'body' | 'header';

export type VariableExtractor = {
  id: string;
  name: string;
  source: VariableExtractorSource;
  path: string;
};

export type CaseRequest = TestCase & {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  variableExtractors?: VariableExtractor[];
};

export type RunAuth = {
  email: string;
  password: string;
  mfaCode?: string;
};

export type RunConfig = {
  baseUrl: string;
  timeoutMs: number;
  concurrency: number;
  continueOnFail: boolean;
  auth?: RunAuth;
  extractedVariables?: ExtractedVariables;
};

export type CaseResult = {
  caseId: string;
  status: CaseResultStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  httpStatus?: number;
  responseBodyPreview?: string;
  responseBody?: string;
  errorMessage?: string;
  expectedResult?: string;
  extractedVariables?: Record<string, string | number | boolean | object>;
};

export type ExtractedVariables = Record<string, string | number | boolean | object>;

export type RunSummary = {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  canceled: number;
  durationMs?: number;
};

export type RunReport = {
  summary: RunSummary;
  config: RunConfig;
  cases: CaseRequest[];
  results: CaseResult[];
};

