export type PlaywrightStepType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'select'
  | 'wait'
  | 'waitForSelector'
  | 'waitForURL'
  | 'assert'
  | 'screenshot'
  | 'evaluate'
  | 'api'
  | 'extract';

export type AssertionOperator = '==' | '!=' | 'contains' | 'startsWith' | 'endsWith' | '>' | '<' | '>=' | '<=';

export type PlaywrightStepOptions = {
  timeout?: number;
  force?: boolean;
  position?: { x: number; y: number };
  expected?: string;
  operator?: AssertionOperator;
  extractVar?: string;
  extractPath?: string;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
};

export type PlaywrightStep = {
  id: string;
  type: PlaywrightStepType;
  selector?: string;
  value?: string;
  options?: PlaywrightStepOptions;
  description?: string;
};

export type PlaywrightCase = {
  id: string;
  title: string;
  group?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | string;
  enabled: boolean;
  steps: PlaywrightStep[];
  beforeAll?: PlaywrightStep[];
  afterAll?: PlaywrightStep[];
  timeout?: number;
  retries?: number;
  url?: string;
};

export type PlaywrightSuite = {
  id: string;
  name: string;
  cases: PlaywrightCase[];
  settings?: Partial<PlaywrightConfig>;
};

export type PlaywrightConfig = {
  browser: 'chromium' | 'firefox' | 'webkit';
  viewport: { width: number; height: number };
  slowMo: number;
  timeout: number;
  screenshotOnFailure: boolean;
  recordVideo: boolean;
  headless: boolean;
  baseURL?: string;
};

export type PlaywrightCaseCreateInput = Omit<PlaywrightCase, 'id'>;
export type PlaywrightCaseUpdateInput = Partial<Omit<PlaywrightCase, 'id'>>;

export type ExecutionStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'canceled';

export type StepExecutionLog = {
  stepId: string;
  stepIndex: number;
  stepType: PlaywrightStepType;
  description: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
  };
  assertResult?: {
    expected: string;
    actual: string;
    operator: AssertionOperator;
    passed: boolean;
  };
  error?: string;
  screenshot?: string;
};

export type CaseExecutionLog = {
  caseId: string;
  caseTitle: string;
  caseGroup?: string;
  priority?: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  stepLogs: StepExecutionLog[];
  error?: string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
};

export type PlaywrightExecutionLog = {
  id: string;
  runId: string;
  suiteName: string;
  startedAt: string;
  finishedAt?: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  skippedCases: number;
  canceledCases: number;
  durationMs?: number;
  caseLogs: CaseExecutionLog[];
  config: PlaywrightConfig;
  baseURL: string;
};

export type ImportResult = {
  success: boolean;
  suite?: PlaywrightSuite;
  cases: PlaywrightCase[];
  errors?: string[];
  warnings?: string[];
};

export type ReorderAction = {
  caseId: string;
  fromIndex: number;
  toIndex: number;
  type: 'drag' | 'moveUp' | 'moveDown' | 'moveTo';
};
