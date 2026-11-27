import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('overtime repositories load admin records and user requests', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const { adminCount, userCount } = await page.evaluate(async () => {
    const mod = await import('/src/services/overtimeRepositories.ts');
    const admin = await mod.adminOvertimeRepository.list();
    const user = await mod.userOvertimeRepository.list();
    return { adminCount: admin.length, userCount: user.length };
  });

  expect(adminCount).toBeGreaterThan(0);
  expect(userCount).toBeGreaterThan(0);
});
