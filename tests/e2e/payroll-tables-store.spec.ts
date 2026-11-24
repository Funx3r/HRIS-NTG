import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('eselon table soft deletes item and disables trash for nonaktif items', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  const row = page.locator('tr', { hasText: 'NON-ESELON' });
  await expect(row.getByText('Aktif')).toBeVisible();

  // Review Focus #4: Deactivating already-nonaktif item disabled check
  const trashBtn = row.locator('button[aria-label="Nonaktifkan Eselon NON-ESELON"]');
  await trashBtn.click();

  const dialog = page.locator('[role="alertdialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Nonaktifkan Eselon?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Nonaktifkan' }).click();

  await expect(row.getByText('Nonaktif')).toBeVisible();
  await expect(trashBtn).toBeDisabled();
  await expect(trashBtn).toHaveAttribute('title', 'Sudah nonaktif');
});

test('komponen gaji table renders status column and filter', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/komponen');

  await expect(page.locator('th', { hasText: 'STATUS' })).toBeVisible();
  await expect(page.locator('select option', { hasText: 'Semua Status' })).toBeAttached();
});
