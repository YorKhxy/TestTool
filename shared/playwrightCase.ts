export type PlaywrightStepType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'select'
  | 'wait'
  | 'waitForSelector'
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
  baseURL?: string;
};

export type PlaywrightCaseCreateInput = Omit<PlaywrightCase, 'id'>;
export type PlaywrightCaseUpdateInput = Partial<Omit<PlaywrightCase, 'id'>>;
