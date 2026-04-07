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

test('parseTestPlanMarkdown parses optional request columns and auth rules', () => {
  const md = [
    '# API 测试计划',
    '',
    '## 4. 测试用例设计',
    '',
    '### 4.1 管理端接口测试用例',
    '',
    '| 用例ID | 用例描述 | method | 路径 | priority | headers | query | body |',
    '|-------|---------|------|------|-------|---------|-------|------|',
    '| TC-ADM-001 | 登录 | POST | /hashrate/admin/auth/v1/login/password | P0 | - | - | {"email":"admin@admin.com"} |',
    '| TC-ADM-002 | 列表 | GET | /hashrate/admin/account/v1/users | P1 | Authorization: Bearer xxx | page=1 | - |',
    '| TC-CLI-001 | 客户端公告列表 | GET | /hashrate/client/announcement/v1/list | P1 | - | - | - |',
    '| TC-FRONT-001 | 前台配置 | GET | /hashrate/front/config/v1/config | P1 | - | lang=zh-CN | - |',
    '| TC-PING-001 | 健康检查 | GET | /ping | P0 | - | - | - |',
  ].join('\n');

  const parsed = parseTestPlanMarkdown(md);

  assert.equal(parsed.cases.length, 5);
  assert.equal(parsed.cases[0]!.requiresAuth, false);
  assert.equal(parsed.cases[0]!.bodyRaw, '{"email":"admin@admin.com"}');
  assert.equal(parsed.cases[1]!.requiresAuth, true);
  assert.equal(parsed.cases[1]!.headersRaw, 'Authorization: Bearer xxx');
  assert.equal(parsed.cases[1]!.queryRaw, 'page=1');
  assert.equal(parsed.cases[2]!.requiresAuth, false);
  assert.equal(parsed.cases[3]!.requiresAuth, false);
  assert.equal(parsed.cases[3]!.queryRaw, 'lang=zh-CN');
  assert.equal(parsed.cases[4]!.requiresAuth, false);
});

test('parseTestPlanMarkdown warns when meta and case tables are missing', () => {
  const parsed = parseTestPlanMarkdown('# empty');

  assert.deepEqual(parsed.meta, {});
  assert.equal(parsed.cases.length, 0);
  assert.equal(parsed.warnings.length, 2);
});

test('parseTestPlanMarkdown warns on incomplete case table columns', () => {
  const md = [
    '# API 娴嬭瘯璁″垝',
    '',
    '## 4. 娴嬭瘯鐢ㄤ緥璁捐',
    '',
    '### 4.11 绯荤粺鎺ュ彛娴嬭瘯鐢ㄤ緥',
    '',
    '| 鐢ㄤ緥ID | 鐢ㄤ緥鎻忚堪 | 璺緞 |',
    '|-------|---------|------|',
    '| TC-SYS-001 | 鍋ュ悍妫€鏌?| /ping |',
  ].join('\n');

  const parsed = parseTestPlanMarkdown(md);

  assert.equal(parsed.cases.length, 0);
  assert.equal(parsed.warnings.length, 2);
});

