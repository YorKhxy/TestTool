# 商户审批模块 - Playwright 测试用例文档

## 测试概述

| 项目 | 说明 |
|------|------|
| **模块名称** | 商户审批模块 |
| **测试类型** | E2E 自动化测试 |
| **测试框架** | Playwright |
| **用例总数** | 13 个 |
| **优先级分布** | P0: 4 个, P1: 5 个, P2: 4 个 |

---

## 测试用例清单

### P0 - 核心功能测试

| 用例ID | 用例标题 | 测试步骤数 | 状态 |
|--------|----------|------------|------|
| TC_MERCHANT_001 | 商户审批 - 页面加载验证 | 4 | ✅ 已实现 |
| TC_MERCHANT_006 | 商户审批 - 点击审批按钮 | 5 | ✅ 已实现 |
| TC_MERCHANT_011 | 商户审批 - 审批通过完整流程 | 7 | ✅ 已实现 |
| TC_MERCHANT_012 | 商户审批 - 审批驳回完整流程 | 10 | ✅ 已实现 |

### P1 - 重要功能测试

| 用例ID | 用例标题 | 测试步骤数 | 状态 |
|--------|----------|------------|------|
| TC_MERCHANT_002 | 商户审批 - 按公司名称搜索 | 6 | ✅ 已实现 |
| TC_MERCHANT_003 | 商户审批 - 按状态筛选 | 6 | ✅ 已实现 |
| TC_MERCHANT_005 | 商户审批 - 查看详情 | 5 | ✅ 已实现 |
| TC_MERCHANT_009 | 商户审批 - 搜索无结果验证 | 6 | ✅ 已实现 |
| TC_MERCHANT_010 | 商户审批 - 详情信息验证 | 6 | ✅ 已实现 |

### P2 - 辅助功能测试

| 用例ID | 用例标题 | 测试步骤数 | 状态 |
|--------|----------|------------|------|
| TC_MERCHANT_004 | 商户审批 - 重置筛选条件 | 6 | ✅ 已实现 |
| TC_MERCHANT_007 | 商户审批 - 分页功能 | 5 | ✅ 已实现 |
| TC_MERCHANT_008 | 商户审批 - 侧边栏导航 | 4 | ✅ 已实现 |
| TC_MERCHANT_013 | 商户审批 - 分页边界验证 | 9 | ✅ 已实现 |

---

## 详细用例说明

### TC_MERCHANT_001 - 商户审批 - 页面加载验证

**优先级**: P0
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | h2:has-text("商户审批") | 等待页面标题出现 |
| 3 | assert | table thead th:has-text("公司名称") | 验证表格表头存在 |
| 4 | assert | span:has-text("共 24 条记录") | 验证总记录数显示 |

**预期结果**:
- 页面正常加载
- 表格表头显示完整
- 记录数显示为 24 条

---

### TC_MERCHANT_002 - 商户审批 - 按公司名称搜索

**优先级**: P1
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | input[placeholder="请输入公司名称搜索..."] | 等待搜索框加载 |
| 3 | fill | input[placeholder="请输入公司名称搜索..."] | 北京智研科技有限公司 |
| 4 | click | button:has-text("查询") | 点击查询按钮 |
| 5 | wait | 1000 | 等待搜索结果 |
| 6 | assert | table tbody tr:first-child td:first-child | 验证搜索结果包含目标公司 |

**预期结果**:
- 搜索结果包含"北京智研科技有限公司"

---

### TC_MERCHANT_003 - 商户审批 - 按状态筛选

**优先级**: P1
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | select | 等待状态下拉框加载 |
| 3 | select | select | 已驳回 (Rejected) |
| 4 | click | button:has-text("查询") | 点击查询按钮 |
| 5 | wait | 1000 | 等待筛选结果 |
| 6 | assert | table tbody tr:first-child td:nth-child(3) | 验证筛选结果为已驳回状态 |

**预期结果**:
- 所有结果显示为"已驳回 (Rejected)"状态

---

### TC_MERCHANT_004 - 商户审批 - 重置筛选条件

**优先级**: P2
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | input[placeholder="请输入公司名称搜索..."] | 等待搜索框加载 |
| 3 | fill | input[placeholder="请输入公司名称搜索..."] | 测试公司 |
| 4 | click | button:has-text("重置") | 点击重置按钮 |
| 5 | wait | 500 | 等待重置操作完成 |
| 6 | evaluate | document.querySelector(...) | 获取重置后的输入框值 |

**预期结果**:
- 输入框已清空

---

### TC_MERCHANT_005 - 商户审批 - 查看详情

**优先级**: P1
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | table tbody tr | 等待数据行加载 |
| 3 | click | table tbody tr:first-child button:has-text("详情") | 点击详情按钮 |
| 4 | waitForSelector | [role="dialog"], .ant-modal, .modal | 等待详情弹窗出现 |
| 5 | assert | [role="dialog"], .ant-modal, .modal | 验证详情弹窗内容 |

**预期结果**:
- 详情弹窗正常显示

---

### TC_MERCHANT_006 - 商户审批 - 点击审批按钮

**优先级**: P0
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | table tbody tr:first-child button:has-text("审批") | 等待审批按钮可用 |
| 3 | click | table tbody tr:first-child button:has-text("审批") | 点击审批按钮 |
| 4 | waitForSelector | [role="dialog"], .ant-modal, .modal | 等待审批弹窗出现 |
| 5 | assert | body | 验证审批弹窗出现 |

**预期结果**:
- 审批弹窗正常显示

---

### TC_MERCHANT_007 - 商户审批 - 分页功能

**优先级**: P2
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | button:has-text("2") | 等待分页加载 |
| 3 | click | button:has-text("2") | 点击第2页 |
| 4 | wait | 1000 | 等待页面切换 |
| 5 | assert | button:has-text("2") | 验证第2页被选中 |

**预期结果**:
- 成功切换到第2页

---

### TC_MERCHANT_008 - 商户审批 - 侧边栏导航

**优先级**: P2
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | nav a:has-text("商户列表") | 等待菜单加载 |
| 3 | click | nav a:has-text("商户列表") | 点击商户列表菜单 |
| 4 | waitForSelector | h2:has-text("商户列表") | 等待页面跳转完成 |

**预期结果**:
- 成功跳转到商户列表页面

---

### TC_MERCHANT_009 - 商户审批 - 搜索无结果验证

**优先级**: P1
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | input[placeholder="请输入公司名称搜索..."] | 等待搜索框加载 |
| 3 | fill | input[placeholder="请输入公司名称搜索..."] | 不存在的公司名称XYZ12345 |
| 4 | click | button:has-text("查询") | 点击查询按钮 |
| 5 | wait | 1500 | 等待搜索结果 |
| 6 | assert | table tbody tr | 验证无数据返回 |

**预期结果**:
- 表格无数据行

---

### TC_MERCHANT_010 - 商户审批 - 详情信息验证

**优先级**: P1
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | table tbody tr:first-child | 等待数据行加载 |
| 3 | extract | table tbody tr:first-child td:first-child | 提取公司名称用于验证 |
| 4 | click | table tbody tr:first-child button:has-text("详情") | 点击详情按钮 |
| 5 | waitForSelector | [role="dialog"], .ant-modal, .modal | 等待详情弹窗 |
| 6 | assert | [role="dialog"], .ant-modal, .modal | 验证详情包含公司名称 |

**预期结果**:
- 详情弹窗显示的公司名称与列表一致

---

### TC_MERCHANT_011 - 商户审批 - 审批通过完整流程

**优先级**: P0
**前置条件**: 已登录系统，存在待处理的商户申请
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | table tbody tr | 等待数据行加载 |
| 3 | click | table tbody tr:first-child button:has-text("审批") | 点击审批按钮 |
| 4 | waitForSelector | [role="dialog"], .ant-modal, .modal | 等待审批弹窗 |
| 5 | click | button:has-text("通过"), button:has-text("批准"), button:has-text("同意") | 点击通过/批准按钮 |
| 6 | wait | 1500 | 等待操作完成 |
| 7 | assert | table tbody tr:first-child td:nth-child(3) | 验证状态已变为已通过 |

**预期结果**:
- 商户状态变为"已通过"

---

### TC_MERCHANT_012 - 商户审批 - 审批驳回完整流程

**优先级**: P0
**前置条件**: 已登录系统，存在待处理的商户申请
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | table tbody tr | 等待数据行加载 |
| 3 | click | table tbody tr:first-child button:has-text("审批") | 点击审批按钮 |
| 4 | waitForSelector | [role="dialog"], .ant-modal, .modal | 等待审批弹窗 |
| 5 | click | button:has-text("驳回"), button:has-text("拒绝") | 点击驳回按钮 |
| 6 | waitForSelector | textarea, input[type="text"] | 等待驳回原因输入框 |
| 7 | fill | textarea, input[type="text"] | 资质不符合要求 |
| 8 | click | button:has-text("确认"), button:has-text("确定") | 点击确认按钮 |
| 9 | wait | 1500 | 等待操作完成 |
| 10 | assert | table tbody tr:first-child td:nth-child(3) | 验证状态已变为已驳回 |

**预期结果**:
- 商户状态变为"已驳回"
- 驳回原因正确显示

---

### TC_MERCHANT_013 - 商户审批 - 分页边界验证

**优先级**: P2
**前置条件**: 已登录系统
**测试步骤**:

| 步骤 | 操作类型 | 选择器/值 | 说明 |
|------|----------|-----------|------|
| 1 | navigate | /merchant/approval | 导航到商户审批页面 |
| 2 | waitForSelector | button:has-text("1") | 等待分页加载 |
| 3 | assert | button:has-text("1") | 验证第1页默认选中 |
| 4 | click | button:has-text("6") | 点击最后一页 |
| 5 | wait | 1000 | 等待页面切换 |
| 6 | assert | button:has-text("6") | 验证最后一页选中 |
| 7 | click | button:has-text("chevron_left"), button:has-text("上一页") | 点击上一页按钮 |
| 8 | wait | 1000 | 等待页面切换 |
| 9 | assert | button:has-text("5") | 验证上一页可选 |

**预期结果**:
- 分页导航功能正常

---

## 文件清单

| 文件路径 | 说明 |
|----------|------|
| `shared/playwrightCases/merchantApproval.ts` | 测试用例数据定义（TypeScript） |
| `shared/playwrightCases/merchantApproval.spec.ts` | Playwright 可执行测试文件 |
| `shared/playwrightCases/merchantApproval.md` | 本文档 |

---

## 执行方式

### 运行所有用例
```bash
npx playwright test shared/playwrightCases/merchantApproval.spec.ts
```

### 运行指定优先级用例
```bash
npx playwright test --grep "P0" shared/playwrightCases/merchantApproval.spec.ts
```

### 运行单个用例
```bash
npx playwright test --grep "TC_MERCHANT_001" shared/playwrightCases/merchantApproval.spec.ts
```

### 生成报告
```bash
npx playwright test --reporter=html shared/playwrightCases/merchantApproval.spec.ts
```

---

## 覆盖率统计

| 功能点 | 覆盖用例 |
|--------|----------|
| 页面加载验证 | TC_MERCHANT_001 |
| 搜索功能 | TC_MERCHANT_002, TC_MERCHANT_009 |
| 状态筛选 | TC_MERCHANT_003 |
| 重置功能 | TC_MERCHANT_004 |
| 查看详情 | TC_MERCHANT_005, TC_MERCHANT_010 |
| 审批操作 | TC_MERCHANT_006, TC_MERCHANT_011, TC_MERCHANT_012 |
| 分页功能 | TC_MERCHANT_007, TC_MERCHANT_013 |
| 导航功能 | TC_MERCHANT_008 |

---

## 更新记录

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-04-10 | v1.0 | 初始版本，包含 8 个测试用例 |
| 2026-04-10 | v2.0 | 补充 5 个缺失用例，修复断言问题 |
