import type { PlaywrightCase, PlaywrightStep, PlaywrightSuite } from '../../shared/playwrightCase.js';

export const merchantApprovalSuite: PlaywrightSuite = {
  id: 'suite_merchant_approval',
  name: '商户审批模块',
  cases: [
    {
      id: 'TC_MERCHANT_001',
      title: '商户审批 - 页面加载验证',
      group: '商户管理',
      priority: 'P0',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'h2:has-text("商户审批")',
          options: { timeout: 10000 },
          description: '等待页面标题出现'
        },
        {
          id: 'step_3',
          type: 'assert',
          selector: 'table thead th:has-text("公司名称")',
          options: { expected: '公司名称', operator: 'contains' },
          description: '验证表格表头存在'
        },
        {
          id: 'step_4',
          type: 'assert',
          selector: 'span:has-text("共 24 条记录")',
          options: { expected: '24', operator: 'contains' },
          description: '验证总记录数显示'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_002',
      title: '商户审批 - 按公司名称搜索',
      group: '商户管理',
      priority: 'P1',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'input[placeholder="请输入公司名称搜索..."]',
          options: { timeout: 10000 },
          description: '等待搜索框加载'
        },
        {
          id: 'step_3',
          type: 'fill',
          selector: 'input[placeholder="请输入公司名称搜索..."]',
          value: '北京智研科技有限公司',
          description: '输入公司名称'
        },
        {
          id: 'step_4',
          type: 'click',
          selector: 'button:has-text("查询")',
          description: '点击查询按钮'
        },
        {
          id: 'step_5',
          type: 'wait',
          value: '1000',
          description: '等待搜索结果'
        },
        {
          id: 'step_6',
          type: 'assert',
          selector: 'table tbody tr:first-child td:first-child',
          options: { expected: '北京智研科技有限公司', operator: 'contains' },
          description: '验证搜索结果包含目标公司'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_003',
      title: '商户审批 - 按状态筛选',
      group: '商户管理',
      priority: 'P1',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'select',
          options: { timeout: 10000 },
          description: '等待状态下拉框加载'
        },
        {
          id: 'step_3',
          type: 'select',
          selector: 'select',
          value: '已驳回 (Rejected)',
          description: '选择已驳回选项'
        },
        {
          id: 'step_4',
          type: 'click',
          selector: 'button:has-text("查询")',
          description: '点击查询按钮'
        },
        {
          id: 'step_5',
          type: 'wait',
          value: '1000',
          description: '等待筛选结果'
        },
        {
          id: 'step_6',
          type: 'assert',
          selector: 'table tbody tr:first-child td:nth-child(3)',
          options: { expected: '已驳回', operator: 'contains' },
          description: '验证筛选结果为已驳回状态'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_004',
      title: '商户审批 - 重置筛选条件',
      group: '商户管理',
      priority: 'P2',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'input[placeholder="请输入公司名称搜索..."]',
          options: { timeout: 10000 },
          description: '等待搜索框加载'
        },
        {
          id: 'step_3',
          type: 'fill',
          selector: 'input[placeholder="请输入公司名称搜索..."]',
          value: '测试公司',
          description: '输入搜索条件'
        },
        {
          id: 'step_4',
          type: 'click',
          selector: 'button:has-text("重置")',
          description: '点击重置按钮'
        },
        {
          id: 'step_5',
          type: 'wait',
          value: '500',
          description: '等待重置操作完成'
        },
        {
          id: 'step_6',
          type: 'evaluate',
          value: "document.querySelector('input[placeholder=\"请输入公司名称搜索...\"]').value",
          options: { extractVar: 'resetValue', extractPath: '' },
          description: '获取重置后的输入框值'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_005',
      title: '商户审批 - 查看详情',
      group: '商户管理',
      priority: 'P1',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'table tbody tr',
          options: { timeout: 10000 },
          description: '等待数据行加载'
        },
        {
          id: 'step_3',
          type: 'click',
          selector: 'table tbody tr:first-child button:has-text("详情")',
          description: '点击第一条记录的详情按钮'
        },
        {
          id: 'step_4',
          type: 'waitForSelector',
          selector: '[role="dialog"], .ant-modal, .modal',
          options: { timeout: 5000 },
          description: '等待详情弹窗出现'
        },
        {
          id: 'step_5',
          type: 'assert',
          selector: '[role="dialog"], .ant-modal, .modal',
          options: { expected: '详情', operator: 'contains' },
          description: '验证详情弹窗内容'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_006',
      title: '商户审批 - 点击审批按钮',
      group: '商户管理',
      priority: 'P0',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'table tbody tr:first-child button:has-text("审批")',
          options: { timeout: 10000 },
          description: '等待审批按钮可用'
        },
        {
          id: 'step_3',
          type: 'click',
          selector: 'table tbody tr:first-child button:has-text("审批")',
          description: '点击审批按钮'
        },
        {
          id: 'step_4',
          type: 'waitForSelector',
          selector: '[role="dialog"], .ant-modal, .modal',
          options: { timeout: 5000 },
          description: '等待审批弹窗出现'
        },
        {
          id: 'step_5',
          type: 'assert',
          selector: 'body',
          options: { expected: '审批', operator: 'contains' },
          description: '验证审批弹窗出现'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_007',
      title: '商户审批 - 分页功能',
      group: '商户管理',
      priority: 'P2',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'button:has-text("2")',
          options: { timeout: 10000 },
          description: '等待分页加载'
        },
        {
          id: 'step_3',
          type: 'click',
          selector: 'button:has-text("2")',
          description: '点击第2页'
        },
        {
          id: 'step_4',
          type: 'wait',
          value: '1000',
          description: '等待页面切换'
        },
        {
          id: 'step_5',
          type: 'assert',
          selector: 'button:has-text("2")',
          options: { expected: 'bg-primary', operator: 'contains' },
          description: '验证第2页被选中'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_008',
      title: '商户审批 - 侧边栏导航',
      group: '商户管理',
      priority: 'P2',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'nav a:has-text("商户列表")',
          options: { timeout: 10000 },
          description: '等待菜单加载'
        },
        {
          id: 'step_3',
          type: 'click',
          selector: 'nav a:has-text("商户列表")',
          description: '点击商户列表菜单'
        },
        {
          id: 'step_4',
          type: 'waitForSelector',
          selector: 'h2:has-text("商户列表")',
          options: { timeout: 5000 },
          description: '等待页面跳转完成'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_009',
      title: '商户审批 - 搜索无结果验证',
      group: '商户管理',
      priority: 'P1',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'input[placeholder="请输入公司名称搜索..."]',
          options: { timeout: 10000 },
          description: '等待搜索框加载'
        },
        {
          id: 'step_3',
          type: 'fill',
          selector: 'input[placeholder="请输入公司名称搜索..."]',
          value: '不存在的公司名称XYZ12345',
          description: '输入不存在的公司名称'
        },
        {
          id: 'step_4',
          type: 'click',
          selector: 'button:has-text("查询")',
          description: '点击查询按钮'
        },
        {
          id: 'step_5',
          type: 'wait',
          value: '1500',
          description: '等待搜索结果'
        },
        {
          id: 'step_6',
          type: 'assert',
          selector: 'table tbody tr',
          options: { expected: '0', operator: '==' },
          description: '验证无数据返回'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_010',
      title: '商户审批 - 详情信息验证',
      group: '商户管理',
      priority: 'P1',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'table tbody tr:first-child',
          options: { timeout: 10000 },
          description: '等待数据行加载'
        },
        {
          id: 'step_3',
          type: 'extract',
          selector: 'table tbody tr:first-child td:first-child',
          options: { extractVar: 'companyName', extractPath: 'textContent' },
          description: '提取公司名称用于验证'
        },
        {
          id: 'step_4',
          type: 'click',
          selector: 'table tbody tr:first-child button:has-text("详情")',
          description: '点击详情按钮'
        },
        {
          id: 'step_5',
          type: 'waitForSelector',
          selector: '[role="dialog"], .ant-modal, .modal',
          options: { timeout: 5000 },
          description: '等待详情弹窗'
        },
        {
          id: 'step_6',
          type: 'assert',
          selector: '[role="dialog"], .ant-modal, .modal',
          options: { expected: '北京智研科技有限公司', operator: 'contains' },
          description: '验证详情包含公司名称'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_011',
      title: '商户审批 - 审批通过完整流程',
      group: '商户管理',
      priority: 'P0',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'table tbody tr',
          options: { timeout: 10000 },
          description: '等待数据行加载'
        },
        {
          id: 'step_3',
          type: 'click',
          selector: 'table tbody tr:first-child button:has-text("审批")',
          description: '点击审批按钮'
        },
        {
          id: 'step_4',
          type: 'waitForSelector',
          selector: '[role="dialog"], .ant-modal, .modal',
          options: { timeout: 5000 },
          description: '等待审批弹窗'
        },
        {
          id: 'step_5',
          type: 'click',
          selector: 'button:has-text("通过"), button:has-text("批准"), button:has-text("同意")',
          description: '点击通过/批准按钮'
        },
        {
          id: 'step_6',
          type: 'wait',
          value: '1500',
          description: '等待操作完成'
        },
        {
          id: 'step_7',
          type: 'assert',
          selector: 'table tbody tr:first-child td:nth-child(3)',
          options: { expected: '已通过', operator: 'contains' },
          description: '验证状态已变为已通过'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_012',
      title: '商户审批 - 审批驳回完整流程',
      group: '商户管理',
      priority: 'P0',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'table tbody tr',
          options: { timeout: 10000 },
          description: '等待数据行加载'
        },
        {
          id: 'step_3',
          type: 'click',
          selector: 'table tbody tr:first-child button:has-text("审批")',
          description: '点击审批按钮'
        },
        {
          id: 'step_4',
          type: 'waitForSelector',
          selector: '[role="dialog"], .ant-modal, .modal',
          options: { timeout: 5000 },
          description: '等待审批弹窗'
        },
        {
          id: 'step_5',
          type: 'click',
          selector: 'button:has-text("驳回"), button:has-text("拒绝")',
          description: '点击驳回按钮'
        },
        {
          id: 'step_6',
          type: 'waitForSelector',
          selector: 'textarea, input[type="text"]',
          options: { timeout: 3000 },
          description: '等待驳回原因输入框'
        },
        {
          id: 'step_7',
          type: 'fill',
          selector: 'textarea, input[type="text"]',
          value: '资质不符合要求',
          description: '输入驳回原因'
        },
        {
          id: 'step_8',
          type: 'click',
          selector: 'button:has-text("确认"), button:has-text("确定")',
          description: '点击确认按钮'
        },
        {
          id: 'step_9',
          type: 'wait',
          value: '1500',
          description: '等待操作完成'
        },
        {
          id: 'step_10',
          type: 'assert',
          selector: 'table tbody tr:first-child td:nth-child(3)',
          options: { expected: '已驳回', operator: 'contains' },
          description: '验证状态已变为已驳回'
        }
      ]
    },
    {
      id: 'TC_MERCHANT_013',
      title: '商户审批 - 分页边界验证',
      group: '商户管理',
      priority: 'P2',
      enabled: true,
      steps: [
        {
          id: 'step_1',
          type: 'navigate',
          value: '/merchant/approval',
          description: '导航到商户审批页面'
        },
        {
          id: 'step_2',
          type: 'waitForSelector',
          selector: 'button:has-text("1")',
          options: { timeout: 10000 },
          description: '等待分页加载'
        },
        {
          id: 'step_3',
          type: 'assert',
          selector: 'button:has-text("1")',
          options: { expected: 'bg-primary', operator: 'contains' },
          description: '验证第1页默认选中'
        },
        {
          id: 'step_4',
          type: 'click',
          selector: 'button:has-text("6")',
          description: '点击最后一页'
        },
        {
          id: 'step_5',
          type: 'wait',
          value: '1000',
          description: '等待页面切换'
        },
        {
          id: 'step_6',
          type: 'assert',
          selector: 'button:has-text("6")',
          options: { expected: 'bg-primary', operator: 'contains' },
          description: '验证最后一页选中'
        },
        {
          id: 'step_7',
          type: 'click',
          selector: 'button:has-text("chevron_left"), button:has-text("上一页")',
          description: '点击上一页按钮'
        },
        {
          id: 'step_8',
          type: 'wait',
          value: '1000',
          description: '等待页面切换'
        },
        {
          id: 'step_9',
          type: 'assert',
          selector: 'button:has-text("5")',
          options: { expected: 'bg-primary', operator: 'contains' },
          description: '验证上一页可选'
        }
      ]
    }
  ]
};

export const sideNavMenuItems = [
  { name: '商户审批', path: '/merchant/approval', isActive: true },
  { name: '商户审批记录', path: '/merchant/approval/records', isActive: false },
  { name: '商户列表', path: '/merchant/list', isActive: false },
  { name: '应用待审批', path: '/app/pending', isActive: false },
  { name: '应用审批记录', path: '/app/approval/records', isActive: false },
  { name: '应用待上架', path: '/app/pending/shelf', isActive: false },
  { name: '已上架应用', path: '/app/shelf', isActive: false },
  { name: '财务管理', path: '/finance', isActive: false },
  { name: '用户管理', path: '/user', isActive: false },
  { name: '角色管理', path: '/role', isActive: false },
  { name: '菜单管理', path: '/menu', isActive: false }
];

export const tableHeaders = [
  '公司名称',
  '手机号',
  '状态',
  '驳回原因',
  '提交时间',
  '审批时间',
  '操作'
];

export const statusOptions = [
  '待处理 (Pending)',
  '已驳回 (Rejected)',
  '全部 (All)'
];
