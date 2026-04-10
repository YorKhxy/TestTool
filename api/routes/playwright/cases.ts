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

  const testCaseRegex = /test\s*\(\s*`\[(\w+)\]\s*(\w+)\s*-\s*(.+?)`,\s*(?:async\s*)?\(\s*(?:\{\s*page\s*\})?\s*=>\s*\{/g;
  let match;

  while ((match = testCaseRegex.exec(content)) !== null) {
    const priority = match[1];
    const id = match[2];
    const title = match[3];

    const caseContent = content.slice(match.index, content.indexOf('});', match.index));
    const steps: PlaywrightStep[] = [];

    const stepRegex = /(?:await\s+)?(page\.(?:click|fill|selectOption|waitForSelector|wait|goto|evaluate|navigate|press|hover|type|check|uncheck)|expect\(|console\.log)/g;
    let stepMatch;
    let stepIndex = 0;

    while ((stepMatch = stepRegex.exec(caseContent)) !== null) {
      stepIndex++;
      const stepText = stepMatch[0];
      let stepType: PlaywrightStepType = 'click';
      let selector = '';
      let value = '';
      let description = '';
      const options: Record<string, unknown> = {};

      if (stepText.includes('page.goto') || stepText.includes('navigate')) {
        stepType = 'navigate';
        const urlMatch = stepText.match(/goto\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (urlMatch) {
          value = urlMatch[1];
        }
        description = `导航到 ${value}`;
      } else if (stepText.includes('page.click')) {
        stepType = 'click';
        const selMatch = stepText.match(/click\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (selMatch) {
          selector = selMatch[1];
        }
        description = `点击元素: ${selector}`;
      } else if (stepText.includes('page.fill')) {
        stepType = 'fill';
        const selMatch = stepText.match(/fill\s*\(\s*['"`]([^'"`]+)['"`]/);
        const valMatch = stepText.match(/,\s*['"`]([^'"`]+)['"`]/);
        if (selMatch) {
          selector = selMatch[1];
        }
        if (valMatch) {
          value = valMatch[1];
        }
        description = `填写 ${selector}: ${value}`;
      } else if (stepText.includes('page.selectOption')) {
        stepType = 'select';
        const selMatch = stepText.match(/selectOption\s*\(\s*['"`]([^'"`]+)['"`]/);
        const valMatch = stepText.match(/,\s*['"`]([^'"`]+)['"`]/);
        if (selMatch) {
          selector = selMatch[1];
        }
        if (valMatch) {
          value = valMatch[1];
        }
        description = `选择 ${selector}: ${value}`;
      } else if (stepText.includes('page.waitForSelector')) {
        stepType = 'waitForSelector';
        const selMatch = stepText.match(/waitForSelector\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (selMatch) {
          selector = selMatch[1];
        }
        description = `等待元素: ${selector}`;
      } else if (stepText.includes('page.wait')) {
        stepType = 'wait';
        const timeMatch = stepText.match(/wait\s*\(\s*(\d+)/);
        if (timeMatch) {
          value = timeMatch[1];
        }
        description = `等待 ${value}ms`;
      } else if (stepText.includes('expect')) {
        stepType = 'assert';
        const selMatch = stepText.match(/\(selector\)\.to(Contain|HaveText|HaveValue|BeVisible)/);
        if (selMatch) {
          selector = 'element';
          const operatorMap: Record<string, string> = {
            Contain: 'contains',
            HaveText: '==',
            HaveValue: '==',
            BeVisible: 'contains',
          };
          options.operator = operatorMap[selMatch[1]] || 'contains';
          options.expected = 'expected';
        }
        description = '断言验证';
      } else {
        continue;
      }

      steps.push({
        id: `${id}_step_${stepIndex}`,
        type: stepType,
        selector: selector || undefined,
        value: value || undefined,
        options: Object.keys(options).length > 0 ? options : undefined,
        description,
      });
    }

    if (steps.length === 0) {
      warnings.push(`用例 ${id} 未能解析出有效步骤`);
    }

    cases.push({
      id,
      title,
      priority: priority as PlaywrightCase['priority'],
      enabled: true,
      steps,
    });
  }

  if (cases.length === 0) {
    const simpleCaseRegex = /test\s*\(\s*['"]([^'"]+)['"]/g;
    while ((match = simpleCaseRegex.exec(content)) !== null) {
      const title = match[1];
      const id = title.replace(/\s+/g, '_').toUpperCase();
      cases.push({
        id,
        title,
        priority: 'P1',
        enabled: true,
        steps: [],
      });
    }
  }

  if (cases.length === 0) {
    errors.push('未能从 .spec.ts 文件中解析出任何测试用例');
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
