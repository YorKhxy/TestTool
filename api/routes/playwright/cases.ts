import { Router, type Request, type Response } from 'express';
import type {
  PlaywrightSuite,
  PlaywrightCase,
  PlaywrightStep,
  PlaywrightStepType,
  ImportResult,
} from '../../shared/playwrightCase.js';

const router = Router();

function parseMarkdownToCases(content: string, fileName: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cases: PlaywrightCase[] = [];

  const lines = content.split('\n');
  let currentCase: Partial<PlaywrightCase> | null = null;
  let currentSteps: PlaywrightStep[] = [];
  let inStepsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (line.startsWith('### TC_') || line.startsWith('## TC_')) {
      if (currentCase && currentSteps.length > 0) {
        cases.push({
          id: currentCase.id!,
          title: currentCase.title!,
          group: currentCase.group,
          priority: currentCase.priority,
          enabled: currentCase.enabled ?? true,
          steps: currentSteps,
        });
      }

      const idMatch = line.match(/(TC_\w+)/);
      if (!idMatch) {
        errors.push(`第 ${lineNum} 行：无法解析用例ID`);
        continue;
      }

      const titleMatch = line.match(/(?:TC_\w+)\s*[-–]\s*(.+)/);
      currentCase = {
        id: idMatch[1],
        title: titleMatch ? titleMatch[1].trim() : idMatch[1],
        group: '默认组',
        priority: 'P1',
        enabled: true,
      };
      currentSteps = [];
      inStepsSection = false;
    }

    if (line.startsWith('**优先级**') || line.startsWith('**Priority**')) {
      const match = line.match(/(?:P0|P1|P2|P3)/i);
      if (match) {
        currentCase!.priority = match[0].toUpperCase();
      }
    }

    if (line.startsWith('**分组**') || line.startsWith('**Group**')) {
      const match = line.match(/[:：]\s*(.+)/);
      if (match) {
        currentCase!.group = match[1].trim();
      }
    }

    if (line.includes('测试步骤') || line.includes('Test Steps') || line.includes('| 步骤 |')) {
      inStepsSection = true;
      continue;
    }

    if (inStepsSection && line.startsWith('|') && !line.includes('---')) {
      const parts = line.split('|').filter((p) => p.trim());
      if (parts.length >= 3) {
        const stepNum = parts[0].trim();
        const stepType = parts[1].trim().toLowerCase();
        const selectorOrValue = parts[2].trim();
        const description = parts[3]?.trim() || '';

        if (stepNum && !isNaN(Number(stepNum))) {
          const stepTypeMap: Record<string, PlaywrightStepType> = {
            navigate: 'navigate',
            click: 'click',
            fill: 'fill',
            select: 'select',
            wait: 'wait',
            waitforselector: 'waitForSelector',
            waitforurl: 'waitForURL',
            assert: 'assert',
            screenshot: 'screenshot',
            evaluate: 'evaluate',
            api: 'api',
            extract: 'extract',
          };

          const mappedType = stepTypeMap[stepType] || 'click';
          const step: PlaywrightStep = {
            id: `${currentCase!.id}_step_${stepNum}`,
            type: mappedType,
            description: description,
          };

          if (mappedType === 'navigate' || mappedType === 'wait') {
            step.value = selectorOrValue;
          } else if (mappedType === 'fill' || mappedType === 'select') {
            step.selector = selectorOrValue;
            const value = parts[3]?.trim();
            if (value) {
              step.value = value;
            }
          } else if (mappedType === 'assert') {
            step.selector = selectorOrValue;
            const expected = parts[3]?.trim();
            const operator = parts[4]?.trim() || 'contains';
            step.options = { expected, operator };
          } else {
            step.selector = selectorOrValue;
          }

          currentSteps.push(step);
        }
      }
    }
  }

  if (currentCase && currentSteps.length > 0) {
    cases.push({
      id: currentCase.id!,
      title: currentCase.title!,
      group: currentCase.group,
      priority: currentCase.priority,
      enabled: currentCase.enabled ?? true,
      steps: currentSteps,
    });
  }

  if (cases.length === 0) {
    errors.push('未能从文件中解析出任何测试用例');
  }

  const suite: PlaywrightSuite = {
    id: `suite_${Date.now()}`,
    name: fileName.replace(/\.(md|spec\.ts)$/i, ''),
    cases,
  };

  return {
    success: cases.length > 0,
    suite,
    cases,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function parseSpecToCases(content: string, fileName: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cases: PlaywrightCase[] = [];

  const constants: Record<string, string> = {};
  const constRegex = /const\s+(\w+)\s*=\s*['"`]([^'"`]+)['"`]/g;
  let constMatch;
  while ((constMatch = constRegex.exec(content)) !== null) {
    constants[constMatch[1]] = constMatch[2];
  }

  function expandTemplate(text: string): string {
    return text.replace(/\$\{(\w+)\}/g, (match, varName) => {
      return constants[varName] !== undefined ? constants[varName] : match;
    });
  }

  function expandValue(text: string): string {
    if (text.includes('${')) {
      return expandTemplate(text);
    }
    return text;
  }

  const locatorVars: Record<string, string> = {};
  const locatorVarRegex = /const\s+(\w+)\s*=\s*(?:page\.)?locator\s*\(\s*'([^']+)'\s*\)/g;
  let varMatch;
  while ((varMatch = locatorVarRegex.exec(content)) !== null) {
    locatorVars[varMatch[1]] = varMatch[2];
  }

  const locatorVarFirstRegex = /const\s+(\w+)\s*=\s*(?:page\.)?locator\s*\(\s*'([^']+)'\s*\)\.first\(\)/g;
  while ((varMatch = locatorVarFirstRegex.exec(content)) !== null) {
    locatorVars[varMatch[1]] = varMatch[2];
  }

  const stepPatterns: Array<{
    regex: RegExp;
    type: PlaywrightStepType;
    getSelector?: (m: RegExpMatchArray, line: string) => string | undefined;
    getValue?: (m: RegExpMatchArray) => string;
    getDesc?: (s?: string, v?: string) => string;
  }> = [
    { regex: /page\.goto\s*\(\s*`([^`]+)`/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
    { regex: /page\.goto\s*\(\s*'([^']+)'/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
    { regex: /page\.fill\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
    { regex: /\.locator\s*\(\s*'([^']+)'\)\.first\(\)\.fill\s*\(\s*'([^']+)'/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
    { regex: /\.locator\s*\(\s*'([^']+)'\)\.fill\s*\(\s*'([^']+)'/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
    { regex: /\.fill\s*\(\s*'([^']+)'/, type: 'fill', getSelector: (m, line) => {
      const varName = line.match(/(?:await\s+)?(\w+)\.fill/)?.[1];
      if (varName && locatorVars[varName]) return locatorVars[varName];
      return undefined;
    }, getValue: (m) => m[1], getDesc: (s, v) => `填写 ${s || '未知'}: ${v}` },
    { regex: /page\.click\s*\(\s*'([^']+)'/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
    { regex: /\.click\s*\(\s*\)/, type: 'click', getSelector: (m, line) => {
      const varName = line.match(/(?:await\s+)?(\w+)\.click/)?.[1];
      if (varName && locatorVars[varName]) return locatorVars[varName];
      return undefined;
    }, getDesc: (s) => s ? `点击 ${s}` : `点击元素` },
    { regex: /\.locator\s*\(\s*'([^']+)'\)\.first\(\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
    { regex: /\.locator\s*\(\s*'([^']+)'\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
    { regex: /page\.selectOption\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/, type: 'select', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `选择 ${s}: ${v}` },
    { regex: /page\.waitForSelector\s*\(\s*'([^']+)'/, type: 'waitForSelector', getSelector: (m) => m[1], getDesc: (s) => `等待元素 ${s}` },
    { regex: /page\.waitForTimeout\s*\(\s*(\d+)/, type: 'wait', getValue: (m) => m[1], getDesc: (v) => `等待 ${v}ms` },
    { regex: /page\.press\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/, type: 'press', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `按键 ${s}: ${v}` },
    { regex: /page\.waitForURL\s*\(\s*'([^']+)'/, type: 'waitForURL', getValue: (m) => m[1], getDesc: (v) => `等待 URL: ${v}` },
    { regex: /page\.waitForLoadState\s*\(\s*'([^']+)'/, type: 'wait', getValue: (m) => m[1], getDesc: (v) => `等待加载状态: ${v}` },
  ];

  function extractSteps(text: string): PlaywrightStep[] {
    const steps: PlaywrightStep[] = [];
    let stepIndex = 0;
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      for (const pattern of stepPatterns) {
        const regex = new RegExp(pattern.regex.source, 'g');
        let stepMatch;
        while ((stepMatch = regex.exec(trimmedLine)) !== null) {
          stepIndex++;
          const step: PlaywrightStep = {
            id: `step_${stepIndex}`,
            type: pattern.type,
            description: pattern.getDesc ? pattern.getDesc(pattern.getSelector?.(stepMatch, trimmedLine), pattern.getValue?.(stepMatch)) : `Step ${stepIndex}`,
          };
          if (pattern.getSelector) {
            const selector = pattern.getSelector(stepMatch, trimmedLine);
            if (selector) step.selector = expandValue(selector);
          }
          if (pattern.getValue) step.value = expandValue(pattern.getValue(stepMatch));
          steps.push(step);
        }
      }
    }
    return steps;
  }

  const beforeEachBlockMatch = content.match(/test\.beforeEach\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>?\s*\{([\s\S]*?)\n  \}/);
  let beforeEachSteps: PlaywrightStep[] = [];
  if (beforeEachBlockMatch) {
    const beforeEachContent = beforeEachBlockMatch[1].trim();
    beforeEachSteps = extractSteps(beforeEachContent);
  }

  const testRegex = /test\s*\(\s*'([^']+)'\s*,/g;
  let match;

  while ((match = testRegex.exec(content)) !== null) {
    const title = match[1].trim();

    const caseStartIndex = match.index;
    const nextTestMatch = content.indexOf("\n  test('", caseStartIndex + 5);
    const nextTestDescribeMatch = content.indexOf("\ntest.describe('", caseStartIndex + 5);
    const nextTestBeforeEachMatch = content.indexOf("\n  test.beforeEach(", caseStartIndex + 5);
    const nextTestAfterEachMatch = content.indexOf("\n  test.afterEach(", caseStartIndex + 5);
    let nextMatch = nextTestMatch;
    if (nextTestDescribeMatch !== -1 && (nextMatch === -1 || nextTestDescribeMatch < nextMatch)) {
      nextMatch = nextTestDescribeMatch;
    }
    if (nextTestBeforeEachMatch !== -1 && (nextMatch === -1 || nextTestBeforeEachMatch < nextMatch)) {
      nextMatch = nextTestBeforeEachMatch;
    }
    if (nextTestAfterEachMatch !== -1 && (nextMatch === -1 || nextTestAfterEachMatch < nextMatch)) {
      nextMatch = nextTestAfterEachMatch;
    }
    const caseEndIndex = nextMatch === -1 ? content.length : nextMatch;
    let caseContent = content.slice(caseStartIndex, caseEndIndex);

    caseContent = caseContent.replace(/\n\s*test\.beforeEach\s*\([^)]*\)\s*\{[^}]*\}/g, '');
    caseContent = caseContent.replace(/\n\s*test\.afterEach\s*\([^)]*\)\s*\{[^}]*\}/g, '');

    const steps: PlaywrightStep[] = [...beforeEachSteps];

    let stepIndex = steps.length;
    const lines = caseContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      for (const pattern of stepPatterns) {
        const regex = new RegExp(pattern.regex.source, 'g');
        let stepMatch;
        while ((stepMatch = regex.exec(trimmedLine)) !== null) {
          stepIndex++;
          const step: PlaywrightStep = {
            id: `step_${stepIndex}`,
            type: pattern.type,
            description: pattern.getDesc ? pattern.getDesc(pattern.getSelector?.(stepMatch, trimmedLine), pattern.getValue?.(stepMatch)) : `Step ${stepIndex}`,
          };
          if (pattern.getSelector) {
            const selector = pattern.getSelector(stepMatch, trimmedLine);
            if (selector) step.selector = expandValue(selector);
          }
          if (pattern.getValue) step.value = expandValue(pattern.getValue(stepMatch));
          steps.push(step);
        }
      }
    }

    if (steps.length === 0) {
      warnings.push(`用例 "${title}" 未能解析出有效步骤`);
    }

    const safeTitle = title.replace(/[^\w\u4e00-\u9fff]/g, '_').substring(0, 30);
    const id = `TC_${safeTitle}`;

    cases.push({
      id,
      title,
      priority: 'P1',
      enabled: true,
      steps,
    });
  }

  if (cases.length === 0) {
    errors.push('未能从 .spec.ts 文件中解析出任何测试用例');
  }

  const suite: PlaywrightSuite = {
    id: `suite_${Date.now()}`,
    name: fileName.replace(/\.(spec\.)?ts$/i, ''),
    cases,
  };

  return {
    success: cases.length > 0,
    suite,
    cases,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

router.post('/parse', (req: Request, res: Response) => {
  try {
    const { content, fileName } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: '缺少 content 参数',
      });
      return;
    }

    const name = fileName || 'untitled';
    let result: ImportResult;

    if (name.endsWith('.spec.ts') || name.endsWith('.spec.js')) {
      result = parseSpecToCases(content, name);
    } else if (name.endsWith('.md') || name.endsWith('.markdown')) {
      result = parseMarkdownToCases(content, name);
    } else {
      if (content.includes('test(') || content.includes('it(')) {
        result = parseSpecToCases(content, name);
      } else {
        result = parseMarkdownToCases(content, name);
      }
    }

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '解析失败',
    });
  }
});

export default router;
