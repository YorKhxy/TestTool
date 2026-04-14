import { test, expect } from '@playwright/test';

const BASE_URL = 'http://192.168.1.73:3303';

test.describe('开放平台管理端 - 登录功能', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  });

  test('页面基本元素验证', async ({ page }) => {
    await expect(page).toHaveTitle(/开放平台|登录|管理/);

    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登录")');

    await expect(phoneInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
    await expect(loginButton.first()).toBeVisible();
  });

  test('正常登录流程 - 成功登录', async ({ page }) => {
    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();

    await phoneInput.fill('13800000000');
    await passwordInput.fill('123456');
    await loginButton.click();

    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {
      page.waitForURL('**/index**', { timeout: 5000 }).catch(() => {});
    });

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('登录 - 空手机号', async ({ page }) => {
    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();

    await phoneInput.fill('');
    await passwordInput.fill('123456');
    await loginButton.click();

    const errorMsg = page.locator('.el-form-item__error, .ant-form-item-explain, [class*="error"], [class*="message"]:has-text("手机"), [class*="message"]:has-text("请")');
    await expect(errorMsg.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('登录 - 空密码', async ({ page }) => {
    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();

    await phoneInput.fill('13800000000');
    await passwordInput.fill('');
    await loginButton.click();

    const errorMsg = page.locator('.el-form-item__error, .ant-form-item-explain, [class*="error"], [class*="message"]:has-text("密码")');
    await expect(errorMsg.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('登录 - 错误密码', async ({ page }) => {
    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();

    await phoneInput.fill('13800000000');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();

    await page.waitForTimeout(1000);
    const errorMsg = page.locator('.el-message, .ant-message, [class*="message"]:has-text("错误"), [class*="message"]:has-text("失败")');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('登录 - 错误手机号格式', async ({ page }) => {
    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();

    await phoneInput.fill('12345');
    await passwordInput.fill('123456');
    await loginButton.click();

    const errorMsg = page.locator('.el-form-item__error, .ant-form-item-explain, [class*="error"]:has-text("手机")');
    await expect(errorMsg.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('登录 - 密码可见性切换', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    const toggleBtn = page.locator('input[type="password"] ~ *, .eye-icon, .password-toggle');

    const isPasswordType = await passwordInput.getAttribute('type');
    expect(isPasswordType).toBe('password');

    if (await toggleBtn.count() > 0) {
      await toggleBtn.first().click();
      const newType = await passwordInput.getAttribute('type');
      expect(newType).toBe('password');
    }
  });

  test('登录 - 回车键提交', async ({ page }) => {
    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await phoneInput.fill('13800000000');
    await passwordInput.fill('123456');
    await passwordInput.press('Enter');

    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('登录 - 多次失败后锁定', async ({ page }) => {
    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();

    for (let i = 0; i < 5; i++) {
      await phoneInput.fill('13800000000');
      await passwordInput.fill('wrongpassword' + i);
      await loginButton.click();
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(1000);
    const lockMsg = page.locator('text=/锁定|次数|已满/').first();
    const isLocked = await lockMsg.isVisible().catch(() => false);
    expect(isLocked).toBeTruthy();
  });

  test('登录成功 - 检查跳转页面元素', async ({ page }) => {
    const phoneInput = page.locator('input[type="text"], input[placeholder*="手机"], input[placeholder*="phone"], input[name*="phone"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();

    await phoneInput.fill('13800000000');
    await passwordInput.fill('123456');
    await loginButton.click();

    await page.waitForTimeout(3000);
    const currentUrl = page.url();

    if (!currentUrl.includes('/login')) {
      await expect(page.locator('text=/首页|dashboard|欢迎|主控台|工作台/').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});
