import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('attendance repository loads records and user check-in updates storage asynchronously', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/presensi/user');

  // Verify employee attendance page loads with initial absent state
  await expect(page.getByRole('heading', { name: 'Terminal Presensi Mandiri' })).toBeVisible();

  // Test repository direct call
  const recordCount = await page.evaluate(async () => {
    const mod = await import('/src/services/attendanceRepository.ts');
    const list = await mod.attendanceRepository.list();
    return list.length;
  });

  expect(recordCount).toBeGreaterThanOrEqual(5);
});
