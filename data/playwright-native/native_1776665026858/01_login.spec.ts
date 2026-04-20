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

test.describe('管理端 - 登录认证模块', () => {
  test.afterEach(async ({ page }, testInfo) => {
    await takeScreenshot(page, testInfo);
  });

  test('LOGIN-001 登录页面 - 页面元素完整性验证', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form input')).toHaveCount(2);
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    const allButtons = page.locator('form button');
    const buttonCount = await allButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);
  });

  test('LOGIN-002 登录 - 空手机号和验证码提示', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const errorMsg = page.locator('.ant-form-item-explain-error, .ant-message, [class*="error"]');
    const hasError = await errorMsg.count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('LOGIN-003 登录 - 错误验证码提示', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const inputs = page.locator('form input');
    await inputs.nth(0).fill('13800000000');
    await inputs.nth(1).fill('000000');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/login/);
  });

  test('LOGIN-004 登录成功 - 跳转首页', async ({ page }) => {
    await loginAsAdmin(page);

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    expect(currentUrl).toContain('/home/index');
  });

  test('LOGIN-005 登录成功 - 首页卡片展示', async ({ page }) => {
    await loginAsAdmin(page);

    const card = page.locator('.ant-card').first();
    await expect(card).toBeVisible({ timeout: 5000 });
  });
});
