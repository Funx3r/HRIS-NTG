import { test, expect } from '@playwright/test';

test('app boots and serves the login route', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page).toHaveTitle(/BMIS/);
});
