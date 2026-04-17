import { Router, type Request, type Response } from 'express';
// nodemon trigger
import type {
  PlaywrightSuite,
  PlaywrightCase,
  PlaywrightStep,
  PlaywrightStepType,
  ImportResult,
} from '../../../shared/playwrightCase.ts';

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

export function parseSpecToCases(content: string, fileName: string): ImportResult {
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
        if (constants[varName] !== undefined) {
          return constants[varName];
        }
        if (varName === 'ADMIN_BASE_URL') {
          return process.env.ADMIN_BASE_URL || 'http://172.0.0.218:36007';
        }
        if (varName === 'BASE_URL') {
          return process.env.BASE_URL || 'http://172.0.0.218:36007';
        }
        if (varName === 'MERCHANT_BASE_URL') {
          return process.env.MERCHANT_BASE_URL || 'http://172.0.0.218:36007';
        }
        return match;
      });
    }

    function expandValue(text: string): string {
      if (text.includes('${')) {
        return expandTemplate(text);
      }
      return text;
    }

    type HelperDefinition = {
      name: string;
      params: string[];
      body: string;
    };

    function splitArguments(argsText: string): string[] {
      const args: string[] = [];
      let current = '';
      let depth = 0;
      let quote: string | null = null;

      for (let i = 0; i < argsText.length; i++) {
        const char = argsText[i];
        const prev = i > 0 ? argsText[i - 1] : '';

        if (quote) {
          current += char;
          if (char === quote && prev !== '\\') {
            quote = null;
          }
          continue;
        }

        if (char === '"' || char === '\'' || char === '`') {
          quote = char;
          current += char;
          continue;
        }

        if (char === '(' || char === '[' || char === '{') depth++;
        if (char === ')' || char === ']' || char === '}') depth--;

        if (char === ',' && depth === 0) {
          const trimmed = current.trim();
          if (trimmed) args.push(trimmed);
          current = '';
          continue;
        }

        current += char;
      }

      const trimmed = current.trim();
      if (trimmed) args.push(trimmed);
      return args;
    }

    function extractHelperFunctions(source: string): Record<string, HelperDefinition> {
      const helpers: Record<string, HelperDefinition> = {};
      const helperRegex = /async\s+function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\s*\{/g;
      let match;

      while ((match = helperRegex.exec(source)) !== null) {
        const name = match[1];
        const params = match[2]
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => part.replace(/:.+$/, '').replace(/\s*=.+$/, '').trim());

        const bodyStart = helperRegex.lastIndex;
        let braceCount = 1;
        let bodyEnd = bodyStart;

        for (let i = bodyStart; i < source.length; i++) {
          if (source[i] === '{') braceCount++;
          else if (source[i] === '}') braceCount--;
          if (braceCount === 0) {
            bodyEnd = i;
            break;
          }
        }

        helpers[name] = {
          name,
          params,
          body: source.substring(bodyStart, bodyEnd),
        };
      }

      return helpers;
    }

    const helperFunctions = extractHelperFunctions(content);

    const stepPatterns: Array<{
      regex: RegExp;
      type: PlaywrightStepType;
      getSelector?: (m: RegExpMatchArray, line: string) => string | undefined;
      getValue?: (m: RegExpMatchArray) => string;
      getDesc?: (s?: string, v?: string) => string;
      getOptions?: (m: RegExpMatchArray) => Record<string, unknown>;
    }> = [
      // 导航相关
      { regex: /(?:await\s+)?page\.goto\s*\(\s*`([^`]+)`/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
      { regex: /(?:await\s+)?page\.goto\s*\(\s*'([^']+)'/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
      { regex: /(?:await\s+)?page\.goto\s*\(\s*"([^"]+)"/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
      { regex: /(?:await\s+)?page\.goto\s*\(\s*`([^`]+)`\s*\)/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
      { regex: /(?:await\s+)?page\.goto\s*\(\s*'([^']+)'\s*\)/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
      { regex: /(?:await\s+)?page\.goto\s*\(\s*"([^"]+)"\s*\)/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
      
      // 等待相关
      { regex: /(?:await\s+)?page\.waitForLoadState\s*\(\s*'([^']+)'/, type: 'wait', getValue: (m) => m[1], getDesc: (v) => `等待加载状态: ${v}` },
      { regex: /(?:await\s+)?page\.waitForLoadState\s*\(\s*'([^']+)'\s*\)/, type: 'wait', getValue: (m) => m[1], getDesc: (v) => `等待加载状态: ${v}` },
      { regex: /await\s+page\.waitForURL\s*\(\s*'([^']+)'/, type: 'waitForURL', getValue: (m) => m[1], getDesc: (v) => `等待 URL: ${v}` },
      { regex: /await\s+page\.waitForURL\s*\(\s*"([^"]+)"/, type: 'waitForURL', getValue: (m) => m[1], getDesc: (v) => `等待 URL: ${v}` },
      { regex: /await\s+page\.waitForURL\s*\(\s*`([^`]+)`/, type: 'waitForURL', getValue: (m) => m[1], getDesc: (v) => `等待 URL: ${v}` },
      { regex: /await\s+page\.waitForURL\s*\(\s*'([^']+)'\s*,\s*\{[^}]*\}\s*\)/, type: 'waitForURL', getValue: (m) => m[1], getDesc: (v) => `等待 URL: ${v}` },
      { regex: /await\s+page\.waitForTimeout\s*\(\s*(\d+)/, type: 'wait', getValue: (m) => m[1], getDesc: (v) => `等待 ${v}ms` },
      { regex: /await\s+page\.waitForTimeout\s*\(\s*(\d+)\s*\)/, type: 'wait', getValue: (m) => m[1], getDesc: (v) => `等待 ${v}ms` },
      
      // 输入相关
      { regex: /(?:await\s+)?page\.fill\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      { regex: /(?:await\s+)?page\.fill\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      { regex: /(?:await\s+)?page\.fill\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      { regex: /(?:await\s+)?page\.fill\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      { regex: /await\s+(\w+)\.fill\s*\(\s*'([^']+)'\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      { regex: /await\s+(\w+)\.fill\s*\(\s*"([^"]+)"\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      { regex: /await\s+(\w+)\.first\(\)\.fill\s*\(\s*'([^']+)'\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      { regex: /await\s+(\w+)\.first\(\)\.fill\s*\(\s*"([^"]+)"\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      
      // 点击相关
      { regex: /(?:await\s+)?page\.click\s*\(\s*'([^']+)'/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
      { regex: /(?:await\s+)?page\.click\s*\(\s*"([^"]+)"\s*\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
      { regex: /(?:await\s+)?page\.click\s*\(\s*'([^']+)'\s*\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
      { regex: /(?:await\s+)?page\.click\s*\(\s*"([^"]+)"\s*\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
      { regex: /\.locator\s*\(\s*'([^']+)'\)\.first\(\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
      { regex: /\.locator\s*\(\s*"([^"]+)"\)\.first\(\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
      { regex: /\.locator\s*\(\s*'([^']+)'\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
      { regex: /\.locator\s*\(\s*"([^"]+)"\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击 ${s}` },
      { regex: /await\s+(\w+)\.locator\s*\(\s*'([^']+)'\)\.first\(\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[2], getDesc: (s) => `点击 ${s}` },
      { regex: /await\s+(\w+)\.locator\s*\(\s*"([^"]+)"\)\.first\(\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[2], getDesc: (s) => `点击 ${s}` },
      { regex: /await\s+(\w+)\.locator\s*\(\s*'([^']+)'\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[2], getDesc: (s) => `点击 ${s}` },
      { regex: /await\s+(\w+)\.locator\s*\(\s*"([^"]+)"\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[2], getDesc: (s) => `点击 ${s}` },
      { regex: /await\s+(\w+)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击元素 ${s}` },
      { regex: /await\s+(\w+)\.first\(\)\.click\s*\(\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击元素 ${s}` },
      
      // 按键相关
      { regex: /await\s+(\w+)\.press\s*\(\s*'([^']+)'\s*\)/, type: 'click', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `按键 ${v} 于 ${s}` },
      { regex: /await\s+(\w+)\.press\s*\(\s*"([^"]+)"\s*\)/, type: 'click', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `按键 ${v} 于 ${s}` },
      
      // 属性相关
      { regex: /await\s+(\w+)\.getAttribute\s*\(\s*'([^']+)'/, type: 'assert', getDesc: (s, v) => `获取属性: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'getAttribute' }) },
      { regex: /await\s+(\w+)\.getAttribute\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getDesc: (s, v) => `获取属性: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'getAttribute' }) },
      { regex: /await\s+(\w+)\.getAttribute\s*\(\s*"([^"]+)"\s*\)/, type: 'assert', getDesc: (s, v) => `获取属性: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'getAttribute' }) },
      
      // 断言相关
      { regex: /expect\s*\(\s*page\.url\(\)\s*\)\.not\.toContain\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getDesc: (v) => `验证 URL 不包含: ${v}`, getOptions: (m) => ({ expected: m[1], operator: 'notContains', negate: true }) },
      { regex: /expect\s*\(\s*page\.url\(\)\s*\)\.toContain\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getDesc: (v) => `验证 URL 包含: ${v}`, getOptions: (m) => ({ expected: m[1], operator: 'contains' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*'([^']+)'\)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)(?!\s*\.)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s) => `验证元素可见: ${s}`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*"([^"]+)"\)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)(?!\s*\.)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s) => `验证元素可见: ${s}`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*'([^']+)'\)\.first\(\)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)(?!\s*\.)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s) => `验证元素可见: ${s}`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*"([^"]+)"\)\.first\(\)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)(?!\s*\.)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s) => `验证元素可见: ${s}`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*'text=\/([^"]+)\/i?'\s*\)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)(?!\s*\.)/, type: 'assert', getSelector: (m) => `text=/${m[1]}/i`, getDesc: (s) => `验证文本匹配: ${s}`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*text=\/([^"]+)\/i?\s*\)\.first\(\)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)(?!\s*\.)/, type: 'assert', getSelector: (m) => `text=/${m[1]}/i`, getDesc: (s) => `验证文本匹配: ${s}`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*'([^']+)'\)\s*\)\.toContainText\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s, v) => `验证元素包含文本: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'contains' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*"([^"]+)"\)\s*\)\.toContainText\s*\(\s*"([^"]+)"\s*\)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s, v) => `验证元素包含文本: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'contains' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*'([^']+)'\)\s*\)\.toHaveText\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s, v) => `验证元素文本为: ${v}`, getOptions: (m) => ({ expected: m[2], operator: '==' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*"([^"]+)"\)\s*\)\.toHaveText\s*\(\s*"([^"]+)"\s*\)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s, v) => `验证元素文本为: ${v}`, getOptions: (m) => ({ expected: m[2], operator: '==' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*'([^']+)'\)\s*\)\.toBeEnabled\s*\(\s*\)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s) => `验证元素可用: ${s}`, getOptions: () => ({ expected: 'enabled', operator: 'toBeEnabled' }) },
      { regex: /expect\s*\(\s*page\.locator\s*\(\s*"([^"]+)"\)\s*\)\.toBeEnabled\s*\(\s*\)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s) => `验证元素可用: ${s}`, getOptions: () => ({ expected: 'enabled', operator: 'toBeEnabled' }) },
      { regex: /expect\s*\(\s*(\w+)\.first\(\)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)/, type: 'assert', getSelector: (m, line) => {
        const match = line.match(/(\w+)\.first\(\)/);
        return match ? match[1] : undefined;
      }, getDesc: () => `验证元素可见`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /expect\s*\(\s*(\w+)\.first\(\)\s*\)\.toBeEnabled\s*\(\s*\)/, type: 'assert', getSelector: (m, line) => {
        const match = line.match(/(\w+)\.first\(\)/);
        return match ? match[1] : undefined;
      }, getDesc: () => `验证元素可用`, getOptions: () => ({ expected: 'enabled', operator: 'toBeEnabled' }) },
      { regex: /expect\s*\(\s*page\s*\)\.toHaveTitle\s*\(\s*\/([^/]+)\/\s*\)/, type: 'assert', getDesc: (v) => `验证页面标题: ${v}`, getOptions: (m) => ({ expected: m[1], operator: 'hasTitle' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)/, type: 'assert', getSelector: (m, line) => {
        const locatorMatch = line.match(/locator\s*\(\s*'([^']+)'\s*\)/);
        return locatorMatch ? locatorMatch[1] : undefined;
      }, getDesc: () => `验证元素可见`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /expect\s*\(\s*(\w+)\.first\(\)\s*\)\.toHaveCount\s*\(\s*(\d+)\s*\)/, type: 'assert', getDesc: (s, v) => `验证元素数量为: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'count' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.not\.toContain\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getDesc: (v) => `验证值不包含: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'notContains' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toContain\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getDesc: (v) => `验证值包含: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'contains' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toContainText\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getDesc: (s, v) => `验证包含文本: ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'contains' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toHaveText\s*\(\s*'([^']+)'\s*\)/, type: 'assert', getDesc: (s, v) => `验证文本为: ${v}`, getOptions: (m) => ({ expected: m[2], operator: '==' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toBeTruthy\s*\(\s*\)/, type: 'assert', getDesc: () => `验证值为 truthy`, getOptions: () => ({ expected: 'truthy', operator: 'toBeTruthy' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toBeFalsy\s*\(\s*\)/, type: 'assert', getDesc: () => `验证值为 falsy`, getOptions: () => ({ expected: 'falsy', operator: 'toBeFalsy' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toBeNull\s*\(\s*\)/, type: 'assert', getDesc: () => `验证值为 null`, getOptions: () => ({ expected: 'null', operator: 'toBeNull' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.not\.toBeNull\s*\(\s*\)/, type: 'assert', getDesc: () => `验证值不为 null`, getOptions: () => ({ expected: 'notNull', operator: 'notNull' }) },
      { regex: /if\s*\(\s*await\s+(\w+)\.count\(\)\s*>\s*0\s*\)/, type: 'assert', getDesc: (s) => `验证元素存在`, getOptions: () => ({ expected: '>0', operator: 'count' }) },
      { regex: /await\s+(\w+)\.count\(\)\s*>\s*0/, type: 'assert', getDesc: (s) => `检查元素存在`, getOptions: () => ({ expected: '>0', operator: 'count' }) },
      { regex: /await\s+(\w+)\.count\(\)/, type: 'assert', getDesc: (s) => `获取元素数量`, getOptions: () => ({ expected: 'count', operator: 'count' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toBeGreaterThanOrEqual\s*\(\s*(\d+)\s*\)/, type: 'assert', getDesc: (s, v) => `验证值 >= ${v}`, getOptions: (m) => ({ expected: m[2], operator: '>=', type: 'number' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toBeLessThanOrEqual\s*\(\s*(\d+)\s*\)/, type: 'assert', getDesc: (s, v) => `验证值 <= ${v}`, getOptions: (m) => ({ expected: m[2], operator: '<=', type: 'number' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toBeGreaterThan\s*\(\s*(\d+)\s*\)/, type: 'assert', getDesc: (s, v) => `验证值 > ${v}`, getOptions: (m) => ({ expected: m[2], operator: '>', type: 'number' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toBeLessThan\s*\(\s*(\d+)\s*\)/, type: 'assert', getDesc: (s, v) => `验证值 < ${v}`, getOptions: (m) => ({ expected: m[2], operator: '<', type: 'number' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toEqual\s*\(\s*(\d+)\s*\)/, type: 'assert', getDesc: (s, v) => `验证值 == ${v}`, getOptions: (m) => ({ expected: m[2], operator: '==', type: 'number' }) },
      { regex: /expect\s*\(\s*page\s*\)\.toHaveURL\s*\(\s*\/([^/]+)\/\s*\)/, type: 'assert', getDesc: (v) => `验证 URL 匹配: ${v}`, getOptions: (m) => ({ expected: m[1], operator: 'match' }) },
      { regex: /expect\s*\(\s*(\w+)\s*\)\.toMatch\s*\(\s*\/([^/]+)\/\s*\)/, type: 'assert', getDesc: (v) => `验证匹配: ${v}`, getOptions: (m) => ({ expected: m[1], operator: 'match' }) },
      { regex: /await\s+(\w+)\.allTextContents\s*\(\)/, type: 'assert', getDesc: () => `获取所有文本内容`, getOptions: () => ({ expected: 'allTextContents', operator: '==' }) },
      { regex: /expect\s*\(\s*(\w+)\.count\(\)\s*\)\.toBeGreaterThan\s*\(\s*(\d+)\s*\)/, type: 'assert', getDesc: (s, v) => `验证数量 > ${v}`, getOptions: (m) => ({ expected: m[2], operator: 'count>' }) },
      
      // 额外的断言模式 - 支持变量引用的断言
      { regex: /await\s+expect\s*\(\s*(\w+)\.first\(\)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)\s*\.catch\s*\(\s*\(\)\s*=>\s*\{[^}]*\}\s*\)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s) => `验证元素可见: ${s}`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      { regex: /await\s+expect\s*\(\s*(\w+)\s*\)\.toBeVisible\s*\(\s*(?:\{[^}]*\})?\s*\)\s*\.catch\s*\(\s*\(\)\s*=>\s*\{[^}]*\}\s*\)/, type: 'assert', getSelector: (m) => m[1], getDesc: (s) => `验证元素可见: ${s}`, getOptions: () => ({ expected: 'visible', operator: 'toBeVisible' }) },
      
      // 额外的填充模式 - 支持变量引用的填充
      { regex: /await\s+(\w+)\.first\(\)\.fill\s*\(\s*'([^']+)'\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      { regex: /await\s+(\w+)\.first\(\)\.fill\s*\(\s*"([^"]+)"\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `填写 ${s}: ${v}` },
      
      // 额外的点击模式 - 支持变量引用的点击
      { regex: /await\s+(\w+)\.first\(\)\.click\s*\(\s*\)/, type: 'click', getSelector: (m) => m[1], getDesc: (s) => `点击元素 ${s}` },
      
      // 额外的导航模式 - 支持模板字符串
      { regex: /(?:await\s+)?page\.goto\s*\(\s*`([^`]+)`\s*\)/, type: 'navigate', getValue: (m) => m[1], getDesc: (v) => `导航到 ${v}` },
    ];

    stepPatterns.unshift(
      { regex: /await\s+(\w+)\.nth\(\d+\)\.fill\s*\(\s*'([^']+)'\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `濉啓 ${s}: ${v}` },
      { regex: /await\s+(\w+)\.nth\(\d+\)\.fill\s*\(\s*"([^"]+)"\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2], getDesc: (s, v) => `濉啓 ${s}: ${v}` },
      { regex: /await\s+(\w+)\.nth\(\d+\)\.fill\s*\(\s*([^)\s][^)]*)\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2].trim(), getDesc: (s, v) => `濉啓 ${s}: ${v}` },
      { regex: /(?:await\s+)?page\.fill\s*\(\s*'([^']+)'\s*,\s*([^)\s][^)]*)\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2].trim(), getDesc: (s, v) => `濉啓 ${s}: ${v}` },
      { regex: /(?:await\s+)?page\.fill\s*\(\s*"([^"]+)"\s*,\s*([^)\s][^)]*)\s*\)/, type: 'fill', getSelector: (m) => m[1], getValue: (m) => m[2].trim(), getDesc: (s, v) => `濉啓 ${s}: ${v}` },
    );

    function extractSteps(text: string, caseId: string, helperStack: string[] = []): PlaywrightStep[] {
      const steps: PlaywrightStep[] = [];
      let stepIndex = 0;
      const variables: Record<string, string> = {};

      const processedText = text
        .replace(/\.catch\s*\(\s*\(\)\s*=>\s*\{([^}]*)\}/g, (match, catchContent) => {
          return '\n' + catchContent.trim() + '\n';
        })
        .replace(/\.catch\s*\(\s*\(\)\s*=>\s*\{\s*\}/g, '');

      const lines = processedText.split('\n');
      console.log(`[DEBUG] extractSteps: input length=${text.length}, lines=${lines.length}, processedText=${JSON.stringify(processedText.substring(0, 100))}`);

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // 处理变量定义
        const varMatch = trimmedLine.match(/const\s+(\w+)\s*=\s*page\.locator\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (varMatch) {
          const varName = varMatch[1];
          const selector = varMatch[2];
          variables[varName] = selector;
          console.log(`[DEBUG] extractSteps: defined variable ${varName} = ${selector}`);
          continue;
        }

        // 处理复杂的 locator 定义
        const complexVarMatch = trimmedLine.match(/const\s+(\w+)\s*=\s*page\.locator\s*\(\s*([^)]+)\s*\)/);
        if (complexVarMatch) {
          const varName = complexVarMatch[1];
          const selector = complexVarMatch[2];
          variables[varName] = selector;
          console.log(`[DEBUG] extractSteps: defined complex variable ${varName} = ${selector}`);
          continue;
        }

        const helperCallMatch = trimmedLine.match(/(?:const\s+\w+\s*=\s*)?(?:await\s+)?(\w+)\s*\((.*)\)\s*;?$/);
        if (helperCallMatch) {
          const helperName = helperCallMatch[1];
          const helper = helperFunctions[helperName];

          if (helper && !helperStack.includes(helperName)) {
            const rawArgs = splitArguments(helperCallMatch[2]);
            let expandedBody = helper.body;

            helper.params.forEach((param, index) => {
              const arg = rawArgs[index] ?? param;
              expandedBody = expandedBody.replace(
                new RegExp(`\\b${param}\\b`, 'g'),
                arg,
              );
            });

            const nestedSteps = extractSteps(expandedBody, caseId, [...helperStack, helperName]);
            for (const nestedStep of nestedSteps) {
              stepIndex++;
              steps.push({
                ...nestedStep,
                id: `${caseId}_step_${stepIndex}`,
              });
            }
            continue;
          }
        }

        for (const pattern of stepPatterns) {
          try {
            const match = trimmedLine.match(pattern.regex);
            if (match) {
              stepIndex++;
              console.log(`[DEBUG] extractSteps: matched line="${trimmedLine.substring(0, 50)}" type=${pattern.type}`);
              let selector: string | undefined;
              let value: string | undefined;
              if (pattern.getSelector) {
                try {
                  selector = pattern.getSelector(match, trimmedLine);
                  const nthMatch = trimmedLine.match(/\.(?:nth)\((\d+)\)\./);
                  if (selector && variables[selector]) {
                    // 替换变量为实际的 selector
                    selector = variables[selector];
                    console.log(`[DEBUG] extractSteps: replaced variable ${pattern.getSelector?.(match, trimmedLine)} with ${selector}`);
                  } else if (selector && selector.includes(' >> nth=')) {
                    const [selectorKey, nthValue] = selector.split(' >> nth=');
                    if (variables[selectorKey]) {
                      selector = `${variables[selectorKey]} >> nth=${nthValue}`;
                      console.log(`[DEBUG] extractSteps: replaced nth variable ${selectorKey} with ${selector}`);
                    }
                  }
                  if (selector && nthMatch && !selector.includes('>> nth=')) {
                    selector = `${selector} >> nth=${nthMatch[1]}`;
                  }
                  if (selector) selector = expandValue(selector);
                } catch (err) {
                  console.log(`[DEBUG] extractSteps: error processing selector: ${err instanceof Error ? err.message : err}`);
                }
              }
              if (pattern.getValue) {
                try {
                  value = expandValue(pattern.getValue(match));
                } catch (err) {
                  console.log(`[DEBUG] extractSteps: error processing value: ${err instanceof Error ? err.message : err}`);
                }
              }
              const step: PlaywrightStep = {
              id: `${caseId}_step_${stepIndex}`,
              type: pattern.type,
              description: pattern.getDesc ? pattern.getDesc(selector, value) : `Step ${stepIndex}`,
            };
              if (selector) step.selector = selector;
              if (value) step.value = value;
              if (pattern.getOptions) {
                try {
                  step.options = pattern.getOptions(match);
                } catch (err) {
                  console.log(`[DEBUG] extractSteps: error processing options: ${err instanceof Error ? err.message : err}`);
                }
              }
              if (step.description.includes('undefined')) {
                const expectedValue = typeof step.options?.expected === 'string'
                  ? step.options.expected
                  : undefined;
                const fallbackText = expectedValue || value || selector || '';
                step.description = step.description
                  .replace(/undefined/g, fallbackText)
                  .replace(/:\s*$/, '')
                  .trim();
              }
              steps.push(step);
              break;
            }
          } catch (err) {
            console.log(`[DEBUG] extractSteps: error processing pattern: ${err instanceof Error ? err.message : err}`);
          }
        }
      }
      console.log(`[DEBUG] extractSteps: returning ${steps.length} steps`);
      return steps;
    }

    function extractBeforeEachSteps(blockContent: string, caseId: string): PlaywrightStep[] {
      const beforeEachRegex = /test\.beforeEach\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>?\s*\{/;
      const beforeEachMatch = beforeEachRegex.exec(blockContent);

      if (!beforeEachMatch) {
        return [];
      }

      const startIndex = beforeEachMatch.index + beforeEachMatch[0].length;
      let braceCount = 1;
      let endIndex = startIndex;

      for (let i = startIndex; i < blockContent.length && braceCount > 0; i++) {
        if (blockContent[i] === '{') braceCount++;
        else if (blockContent[i] === '}') braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }

      const beforeEachContent = blockContent.substring(startIndex, endIndex);
      console.log(`[DEBUG] beforeEachContent length=${beforeEachContent.length}, content=${JSON.stringify(beforeEachContent.substring(0, 200))}`);
      return extractSteps(beforeEachContent, caseId);
    }

    function extractAfterEachSteps(blockContent: string, caseId: string): PlaywrightStep[] {
      const afterEachRegex = /test\.afterEach\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>?\s*\{/;
      const afterEachMatch = afterEachRegex.exec(blockContent);

      if (!afterEachMatch) {
        return [];
      }

      const startIndex = afterEachMatch.index + afterEachMatch[0].length;
      let braceCount = 1;
      let endIndex = startIndex;

      for (let i = startIndex; i < blockContent.length && braceCount > 0; i++) {
        if (blockContent[i] === '{') braceCount++;
        else if (blockContent[i] === '}') braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }

      const afterEachContent = blockContent.substring(startIndex, endIndex);
      const screenshotSteps: PlaywrightStep[] = [];

      const screenshotRegex = /takeScreenshot\s*\(\s*page\s*,\s*(?:testInfo|caseInfo)/g;
      let screenshotMatch;
      while ((screenshotMatch = screenshotRegex.exec(afterEachContent)) !== null) {
        screenshotSteps.push({
          id: `${caseId}_step_screenshot_${screenshotSteps.length + 1}`,
          type: 'screenshot',
          description: '用例执行后截图',
        });
      }

      return screenshotSteps;
    }

    function splitDescribeBlocks(content: string): Array<{ name: string; content: string; start: number; end: number }> {
      const blocks: Array<{ name: string; content: string; start: number; end: number }> = [];
      const describeRegex = /test\.describe\s*\(\s*['"]([^'"]+)['"]\s*,/g;

      let match;
      while ((match = describeRegex.exec(content)) !== null) {
        const name = match[1];
        const blockStart = match.index;
        const openBracePos = content.indexOf('{', match.index + match[0].length);

        if (openBracePos === -1) continue;

        let braceCount = 1;
        let pos = openBracePos + 1;
        while (pos < content.length && braceCount > 0) {
          if (content[pos] === '{') braceCount++;
          else if (content[pos] === '}') braceCount--;
          pos++;
        }

        const blockEnd = pos;
        blocks.push({
          name,
          content: content.substring(blockStart, blockEnd),
          start: blockStart,
          end: blockEnd,
        });
      }

      return blocks;
    }

    const describeBlocks = splitDescribeBlocks(content);

    for (const block of describeBlocks) {
      // 为 beforeEach 步骤生成一个临时 ID，因为此时还没有具体的测试用例 ID
      const tempBeforeEachId = `beforeEach_${Date.now()}`;
      const beforeEachSteps = extractBeforeEachSteps(block.content, tempBeforeEachId);

      const testRegex = /test\s*\(\s*['"]([^'"]+)['"]\s*,/g;
      let match;

      const allTestMatches: { title: string; start: number; end: number }[] = [];
      while ((match = testRegex.exec(block.content)) !== null) {
        const title = match[1].trim();
        const testStartIndex = match.index;

        const nextTestMatch = block.content.indexOf("\n  test('", testStartIndex + 1);
        const nextDescribeMatch = block.content.indexOf("\ntest.describe('", testStartIndex + 1);

        let caseEndIndex = block.content.length;
        if (nextTestMatch !== -1) caseEndIndex = nextTestMatch;
        if (nextDescribeMatch !== -1 && nextDescribeMatch < caseEndIndex) {
          caseEndIndex = nextDescribeMatch;
        }

        allTestMatches.push({ title, start: testStartIndex, end: caseEndIndex });
      }

      for (let i = 0; i < allTestMatches.length; i++) {
        const { title, start: caseStartIndex, end: caseEndIndex } = allTestMatches[i];

        const prevTestEnd = i > 0 ? allTestMatches[i - 1].end : -1;
        let caseContentStart: number;

        if (prevTestEnd > 0) {
          caseContentStart = prevTestEnd;
        } else {
          const beforeEachRegex = /test\.beforeEach\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>?\s*\{/;
          const beforeEachMatch = beforeEachRegex.exec(block.content);
          if (beforeEachMatch) {
            const beStart = beforeEachMatch.index + beforeEachMatch[0].length;
            let braceCount = 1;
            let beEnd = beStart;
            for (let j = beStart; j < block.content.length && braceCount > 0; j++) {
              if (block.content[j] === '{') braceCount++;
              else if (block.content[j] === '}') { braceCount--; if (braceCount === 0) beEnd = j; }
            }
            caseContentStart = beEnd + 3;
          } else {
            caseContentStart = caseStartIndex;
          }
        }

        let caseContent = block.content.substring(caseContentStart, caseEndIndex);

        // Helper function to remove a block using brace counting
        function removeBlock(content: string, pattern: RegExp): string {
          const match = pattern.exec(content);
          if (!match) return content;
          
          const startIdx = match.index;
          const bracePos = content.indexOf('{', startIdx);
          if (bracePos === -1) return content;
          
          let braceCount = 1;
          let i = bracePos + 1;
          while (i < content.length && braceCount > 0) {
            if (content[i] === '{') braceCount++;
            else if (content[i] === '}') braceCount--;
            i++;
          }
          
          return content.substring(0, startIdx) + content.substring(i);
        }

        // Remove beforeEach blocks using brace counting
        caseContent = removeBlock(caseContent, /\n\s*test\.beforeEach\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>?\s*\{/);
        // Remove afterEach blocks using brace counting
        caseContent = removeBlock(caseContent, /\n\s*test\.afterEach\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>?\s*\{/);

        const safeTitle = title.replace(/[^\w\u4e00-\u9fff]/g, '_').substring(0, 30);
        const id = `TC_${safeTitle}`;

        const steps: PlaywrightStep[] = [...beforeEachSteps];
        const caseSteps = extractSteps(caseContent, id);
        console.log(`[DEBUG] case "${title}": beforeEachSteps=${beforeEachSteps.length}, caseSteps=${caseSteps.length}, total=${steps.length + caseSteps.length}`);
        steps.push(...caseSteps);

        const afterEachSteps = extractAfterEachSteps(block.content, id);
        steps.push(...afterEachSteps);

        if (steps.length === 0) {
          warnings.push(`用例 "${title}" 未能解析出有效步骤`);
        }

        cases.push({
          id,
          title,
          priority: 'P1',
          enabled: true,
          steps,
        });
      }
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
