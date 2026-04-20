# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01_login.spec.ts >> 管理端 - 登录认证模块 >> LOGIN-005 登录成功 - 首页卡片展示
- Location: 01_login.spec.ts:83:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.ant-card').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.ant-card').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e6]:
      - heading "开放平台管理端" [level=2] [ref=e8]
      - menu [ref=e9]:
        - menuitem "home 首页" [ref=e10] [cursor=pointer]:
          - img "home" [ref=e11]:
            - img [ref=e12]
          - generic [ref=e14]: 首页
        - menuitem "shop 商户管理" [ref=e15] [cursor=pointer]:
          - img "shop" [ref=e16]:
            - img [ref=e17]
          - generic [ref=e19]: 商户管理
        - menuitem "appstore 应用管理" [ref=e20] [cursor=pointer]:
          - img "appstore" [ref=e21]:
            - img [ref=e22]
          - generic [ref=e24]: 应用管理
        - menuitem "account-book 财务管理" [ref=e25] [cursor=pointer]:
          - img "account-book" [ref=e26]:
            - img [ref=e27]
          - generic [ref=e29]: 财务管理
        - menuitem "appstore 系统管理" [ref=e30] [cursor=pointer]:
          - img "appstore" [ref=e31]:
            - img [ref=e32]
          - generic [ref=e34]: 系统管理
  - generic [ref=e35]:
    - generic [ref=e36]:
      - generic [ref=e37]:
        - img "menu-fold" [ref=e39] [cursor=pointer]:
          - img [ref=e40]
        - navigation [ref=e42]:
          - list [ref=e43]:
            - listitem [ref=e44]: 首页
      - generic [ref=e45]:
        - generic [ref=e46] [cursor=pointer]: Aa
        - img "expand" [ref=e48] [cursor=pointer]:
          - img [ref=e49]
        - img "user" [ref=e52] [cursor=pointer]:
          - img [ref=e53]
    - generic [ref=e55]:
      - generic [ref=e56]:
        - tablist [ref=e57]:
          - tab "home 首页" [selected] [ref=e61] [cursor=pointer]:
            - generic [ref=e62]:
              - img "home" [ref=e63]:
                - img [ref=e64]
              - text: 首页
        - generic:
          - generic:
            - tabpanel "home 首页"
      - button "更多 down" [ref=e66] [cursor=pointer]:
        - generic [ref=e67]: 更多
        - img "down" [ref=e68]:
          - img [ref=e69]
    - main [ref=e71]:
      - img "welcome" [ref=e73]
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | import fs from 'fs';
  3  | import path from 'path';
  4  | 
  5  | const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'http://172.0.0.218:36007';
  6  | const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'punk-open-platform-admin');
  7  | 
  8  | if (!fs.existsSync(SCREENSHOT_DIR)) {
  9  |   fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  10 | }
  11 | 
  12 | async function takeScreenshot(page: Page, testInfo: { title: string }): Promise<string> {
  13 |   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  14 |   const safeTitle = testInfo.title.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 80);
  15 |   const screenshotName = `${safeTitle}_${timestamp}.png`;
  16 |   const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  17 |   await page.screenshot({ path: screenshotPath, fullPage: true });
  18 |   console.log(`Screenshot saved: ${screenshotPath}`);
  19 |   return screenshotPath;
  20 | }
  21 | 
  22 | async function loginAsAdmin(page: Page, phone: string = '13800000000', code: string = '123456'): Promise<void> {
  23 |   await page.goto(`${ADMIN_BASE_URL}/login`);
  24 |   await page.waitForLoadState('networkidle');
  25 | 
  26 |   const inputs = page.locator('form input');
  27 |   await inputs.nth(0).fill(phone);
  28 |   await inputs.nth(1).fill(code);
  29 |   await page.click('button[type="submit"]');
  30 |   await page.waitForTimeout(2000);
  31 | }
  32 | 
  33 | test.describe('管理端 - 登录认证模块', () => {
  34 |   test.afterEach(async ({ page }, testInfo) => {
  35 |     await takeScreenshot(page, testInfo);
  36 |   });
  37 | 
  38 |   test('LOGIN-001 登录页面 - 页面元素完整性验证', async ({ page }) => {
  39 |     await page.goto(`${ADMIN_BASE_URL}/login`);
  40 |     await page.waitForLoadState('networkidle');
  41 | 
  42 |     await expect(page.locator('form input')).toHaveCount(2);
  43 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  44 | 
  45 |     const allButtons = page.locator('form button');
  46 |     const buttonCount = await allButtons.count();
  47 |     expect(buttonCount).toBeGreaterThanOrEqual(2);
  48 |   });
  49 | 
  50 |   test('LOGIN-002 登录 - 空手机号和验证码提示', async ({ page }) => {
  51 |     await page.goto(`${ADMIN_BASE_URL}/login`);
  52 |     await page.waitForLoadState('networkidle');
  53 | 
  54 |     await page.click('button[type="submit"]');
  55 |     await page.waitForTimeout(500);
  56 | 
  57 |     const errorMsg = page.locator('.ant-form-item-explain-error, .ant-message, [class*="error"]');
  58 |     const hasError = await errorMsg.count() > 0;
  59 |     expect(hasError).toBeTruthy();
  60 |   });
  61 | 
  62 |   test('LOGIN-003 登录 - 错误验证码提示', async ({ page }) => {
  63 |     await page.goto(`${ADMIN_BASE_URL}/login`);
  64 |     await page.waitForLoadState('networkidle');
  65 | 
  66 |     const inputs = page.locator('form input');
  67 |     await inputs.nth(0).fill('13800000000');
  68 |     await inputs.nth(1).fill('000000');
  69 |     await page.click('button[type="submit"]');
  70 |     await page.waitForTimeout(1000);
  71 | 
  72 |     await expect(page).toHaveURL(/login/);
  73 |   });
  74 | 
  75 |   test('LOGIN-004 登录成功 - 跳转首页', async ({ page }) => {
  76 |     await loginAsAdmin(page);
  77 | 
  78 |     const currentUrl = page.url();
  79 |     expect(currentUrl).not.toContain('/login');
  80 |     expect(currentUrl).toContain('/home/index');
  81 |   });
  82 | 
  83 |   test('LOGIN-005 登录成功 - 首页卡片展示', async ({ page }) => {
  84 |     await loginAsAdmin(page);
  85 | 
  86 |     const card = page.locator('.ant-card').first();
> 87 |     await expect(card).toBeVisible({ timeout: 5000 });
     |                        ^ Error: expect(locator).toBeVisible() failed
  88 |   });
  89 | });
  90 | 
```