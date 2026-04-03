import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTestPlanMarkdown } from './testPlan.js';

test('parseTestPlanMarkdown parses meta and cases', () => {
  const md = [
    '# API 测试计划',
    '',
    '## 文档信息',
    '',
    '| 属性 | 内容 |',
    '|------|------|',
    '| Base URL | http://example.test:8999 |',
    '| 测试环境 | http://example.test:8999 |',
    '',
    '## 4. 测试用例设计',
    '',
    '### 4.11 系统接口测试用例',
    '',
    '| 用例ID | 用例描述 | 方法 | 路径 | 优先级 |',
    '|-------|---------|------|------|-------|',
    '| TC-SYS-001 | 健康检查 | GET | /ping | P0 |',
    '',
    '### 5.1 认证测试数据',
    '',
    '| 账户类型 | email | password | 说明 |',
    '|---------|-------|----------|------|',
    '| 管理员 | admin@admin.com | admin123 | 测试用账户 |',
  ].join('\n');

  const parsed = parseTestPlanMarkdown(md);
  assert.equal(parsed.meta.envUrl, 'http://example.test:8999');
  assert.equal(parsed.meta.adminEmail, 'admin@admin.com');
  assert.equal(parsed.meta.adminPassword, 'admin123');
  assert.equal(parsed.cases.length, 1);
  assert.equal(parsed.cases[0]!.id, 'TC-SYS-001');
  assert.equal(parsed.cases[0]!.requiresAuth, false);
});

