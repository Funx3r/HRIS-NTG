import { test, expect } from '@playwright/test';

test('design tokens and font are applied', async ({ page }) => {
  await page.goto('/login');

  const values = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return {
      primary: root.getPropertyValue('--bmis-primary').trim(),
      bg: root.getPropertyValue('--bmis-bg').trim(),
      bodyBg: body.backgroundColor,
      bodyColor: body.color,
      font: body.fontFamily,
    };
  });

  expect(values.primary.toLowerCase()).toBe('#0058be');
  expect(values.bg.toLowerCase()).toBe('#f8f9fa');
  expect(values.bodyBg).toBe('rgb(248, 249, 250)');
  expect(values.bodyColor).toBe('rgb(15, 23, 42)');
  expect(values.font).toContain('Hanken Grotesk');
  expect(values.font).toContain('Inter');
});

test('login shell stays usable when google fonts is blocked', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());

  await page.goto('/login');
  await expect(page.locator('#app')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});
