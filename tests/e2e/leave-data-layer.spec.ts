import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('leave repositories load quotas and allow user leave query', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/presensi/user');

  const { quotaCount, leaveCount } = await page.evaluate(async () => {
    const mod = await import('/src/services/leaveRepositories.ts');
    const quotas = await mod.leaveQuotaRepository.list();
    const leaves = await mod.leaveRepository.list();
    return { quotaCount: quotas.length, leaveCount: leaves.length };
  });

  expect(quotaCount).toBeGreaterThan(0);
  expect(leaveCount).toBeGreaterThanOrEqual(0);
});
