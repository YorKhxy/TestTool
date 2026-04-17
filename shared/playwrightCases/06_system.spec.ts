import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'http://172.0.0.218:36007';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'punk-open-platform-admin');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page: Page, testInfo: { title: string }): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTitle = testInfo.title.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 80);
  const screenshotName = `${safeTitle}_${timestamp}.png`;
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function loginAsAdmin(page: Page, phone: string = '13800000000', code: string = '123456'): Promise<void> {
  await page.goto(`${ADMIN_BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const inputs = page.locator('form input');
  await inputs.nth(0).fill(phone);
  await inputs.nth(1).fill(code);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

async function expectTableVisible(page: Page): Promise<void> {
  await expect(page.locator('.ant-table:visible, table:visible').first()).toBeVisible({ timeout: 5000 });
}

async function fillFirstSearchInput(page: Page, value: string): Promise<void> {
  const searchInput = page.locator('.ant-pro-table-search input:visible').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill(value);
    await page.waitForTimeout(300);
    return;
  }

  const placeholderInput = page.locator('input[placeholder]:visible').first();
  if (await placeholderInput.count() > 0) {
    await placeholderInput.fill(value);
    await page.waitForTimeout(300);
  }
}

async function clickSearchButton(page: Page): Promise<void> {
  const searchButton = page.locator('.ant-pro-table-search button:visible').first();
  if (await searchButton.count() > 0) {
    await searchButton.click();
    await page.waitForTimeout(1000);
    return;
  }

  const buttons = page.locator('button:visible');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const text = await btn.textContent();
    if (text && (text.includes('查询') || text.includes('搜索'))) {
      await btn.click();
      await page.waitForTimeout(1000);
      return;
    }
  }
}

async function hasTableRows(page: Page): Promise<boolean> {
  const rows = page.locator('.ant-table-tbody tr:visible, table tbody tr:visible');
  return (await rows.count()) > 0;
}

async function openRowAction(page: Page, index: number = 0): Promise<boolean> {
  await page.waitForTimeout(500);
  const rows = page.locator('.ant-table-tbody tr:visible, table tbody tr:visible');
  const rowCount = await rows.count();
  if (rowCount === 0) {
    return false;
  }

  const actions = page.locator('.ant-table-tbody tr:visible .ant-btn-link, table tbody tr:visible .ant-btn-link');
  const actionCount = await actions.count();
  if (actionCount === 0) {
    return false;
  }

  const targetIndex = Math.min(index, actionCount - 1);
  const action = actions.nth(targetIndex);
  await action.click();
  return true;
}

test.describe('管理端 - 用户管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_BASE_URL}/system/user/index`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await takeScreenshot(page, testInfo);
  });

  test('SYS-USER-001 用户管理 - 列表展示', async ({ page }) => {
    await expectTableVisible(page);
  });

  test('SYS-USER-002 用户管理 - 新增用户按钮', async ({ page }) => {
    const addButton = page.locator('.ant-pro-table-list-toolbar button:visible').first();
    await expect(addButton).toBeVisible({ timeout: 3000 });
  });

  test('SYS-USER-003 用户管理 - 删除确认弹窗', async ({ page }) => {
    if (!(await hasTableRows(page))) {
      test.skip();
    }

    const opened = await openRowAction(page, 2);
    if (!opened) {
      test.skip();
    }

    const confirmModal = page.locator('.ant-modal-confirm:visible, .ant-modal:visible').first();
    await expect(confirmModal).toBeVisible({ timeout: 3000 });
  });
});

test.describe('管理端 - 角色管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_BASE_URL}/system/role/index`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await takeScreenshot(page, testInfo);
  });

  test('SYS-ROLE-001 角色管理 - 列表展示', async ({ page }) => {
    await expectTableVisible(page);
  });

  test('SYS-ROLE-002 角色管理 - 新增角色弹窗', async ({ page }) => {
    const addButton = page.locator('.ant-pro-table-list-toolbar button:visible').first();
    if (await addButton.count() === 0) {
      test.skip();
    }

    await addButton.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('.ant-modal:visible, [class*="modal"]:visible').first();
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('SYS-ROLE-003 角色管理 - 删除确认弹窗', async ({ page }) => {
    if (!(await hasTableRows(page))) {
      test.skip();
    }

    const opened = await openRowAction(page, 2);
    if (!opened) {
      test.skip();
    }

    const confirmModal = page.locator('.ant-modal-confirm:visible, .ant-modal:visible').first();
    await expect(confirmModal).toBeVisible({ timeout: 3000 });
  });
});

test.describe('管理端 - 菜单管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_BASE_URL}/system/menu/index`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await takeScreenshot(page, testInfo);
  });

  test('SYS-MENU-001 菜单管理 - 树表加载', async ({ page }) => {
    await expectTableVisible(page);
  });

  test('SYS-MENU-002 菜单管理 - 新增菜单弹窗', async ({ page }) => {
    const addButton = page.locator('.ant-pro-table-list-toolbar button:visible').first();
    if (await addButton.count() === 0) {
      test.skip();
    }

    await addButton.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('.ant-modal:visible, [class*="modal"]:visible').first();
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('SYS-MENU-003 菜单管理 - 删除确认弹窗', async ({ page }) => {
    if (!(await hasTableRows(page))) {
      test.skip();
    }

    const opened = await openRowAction(page, 2);
    if (!opened) {
      test.skip();
    }

    const confirmModal = page.locator('.ant-modal-confirm:visible, .ant-modal:visible').first();
    await expect(confirmModal).toBeVisible({ timeout: 3000 });
  });
});
