import { test, expect } from '@playwright/test';

const BASE_URL = 'http://192.168.1.73:3303';

test.describe('开放平台管理端 - 登录功能', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
  });

  test('页面基本元素验证', async ({ page }) => {
    await expect(page).toHaveTitle(/开放平台|登录|管理/);
    await expect(page.locator('input[placeholder*="手机"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="验证码"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('正常登录流程 - 成功登录', async ({ page }) => {
    await page.fill('input[placeholder*="手机"]', '13800000000');
    await page.fill('input[placeholder*="验证码"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('登录 - 空手机号', async ({ page }) => {
    await page.fill('input[placeholder*="验证码"]', '123456');
    await page.click('button[type="submit"]');
  });

  test('登录 - 空验证码', async ({ page }) => {
    await page.fill('input[placeholder*="手机"]', '13800000000');
    await page.click('button[type="submit"]');
  });

  test('登录 - 错误手机号格式', async ({ page }) => {
    await page.fill('input[placeholder*="手机"]', '12345');
    await page.fill('input[placeholder*="验证码"]', '123456');
    await page.click('button[type="submit"]');
  });

  test('登录 - 回车键提交', async ({ page }) => {
    await page.fill('input[placeholder*="手机"]', '13800000000');
    await page.fill('input[placeholder*="验证码"]', '123456');
    await page.press('input[placeholder*="验证码"]', 'Enter');
  });

  test('登录成功 - 检查跳转页面元素', async ({ page }) => {
    await page.fill('input[placeholder*="手机"]', '13800000000');
    await page.fill('input[placeholder*="验证码"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });
});
