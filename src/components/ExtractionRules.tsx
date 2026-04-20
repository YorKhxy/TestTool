export interface ExtractionRule {
  id: string;
  name: string;
  path: string;
  source: 'body' | 'header';
  description?: string;
}

export interface ExtractionRulesFile {
  version: string;
  rules: ExtractionRule[];
}

export function createRule(name: string, path: string, source: 'body' | 'header' = 'body', description?: string): ExtractionRule {
  return {
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    path,
    source,
    description,
  };
}

export function exportRulesToJson(rules: ExtractionRule[]): string {
  const file: ExtractionRulesFile = {
    version: '1.0',
    rules,
  };
  return JSON.stringify(file, null, 2);
}

export function parseRulesFromJson(content: string): ExtractionRule[] {
  try {
    const data = JSON.parse(content);
    if (data.version && Array.isArray(data.rules)) {
      return data.rules.map((r: ExtractionRule) => ({
        id: r.id || `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: r.name || '',
        path: r.path || '',
        source: r.source || 'body',
        description: r.description,
      }));
    }
    if (Array.isArray(data)) {
      return data.map((r: ExtractionRule) => ({
        id: r.id || `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: r.name || '',
        path: r.path || '',
        source: r.source || 'body',
        description: r.description,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export function rulesToMarkdown(rules: ExtractionRule[]): string {
  const lines = [
    '# 提取变量规则',
    '',
    '| 变量名 | 路径 | 来源 | 说明 |',
    '|--------|------|------|------|',
  ];

  for (const rule of rules) {
    lines.push(`| ${rule.name} | \`${rule.path}\` | ${rule.source} | ${rule.description || '-'} |`);
  }

  return lines.join('\n');
}

export function parseRulesFromMarkdown(content: string): ExtractionRule[] {
  const rules: ExtractionRule[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('|') || trimmed.startsWith('|#') || trimmed === '|--------|------|------|------|') {
      continue;
    }

    const parts = trimmed.split('|').filter((p) => p.trim());
    if (parts.length >= 3) {
      const name = parts[1]?.trim().replace(/`/g, '') || '';
      const path = parts[2]?.trim().replace(/`/g, '') || '';
      const source = parts[3]?.trim() === 'header' ? 'header' : 'body';
      const description = parts[4]?.trim();

      if (name && path) {
        rules.push(createRule(name, path, source, description === '-' ? undefined : description));
      }
    }
  }

  return rules;
}
