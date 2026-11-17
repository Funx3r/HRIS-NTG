import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('reference screens render without horizontal overflow', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: 'test-results/design/login.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);

  await loginAs(page, 'admin');
  await page.goto('/dashboard');
  await page.screenshot({ path: 'test-results/design/admin-dashboard.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);

  await loginAs(page, 'employee');
  await page.goto('/presensi/user');
  await page.screenshot({ path: 'test-results/design/employee-presensi.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});
