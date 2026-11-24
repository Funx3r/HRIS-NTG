import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin can create a new eselon item and validates uniqueness', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon/tambah');

  await expect(page.getByRole('heading', { name: 'Tambah Eselon' })).toBeVisible();

  // Review Focus #3: Duplicate code case-insensitivity
  await page.getByLabel(/Kode/i).fill('eselon-i');
  await page.getByLabel(/Urutan/i).fill('99');
  await page.getByLabel(/Nama/i).fill('Testing Eselon Duplicate');
  await page.getByRole('button', { name: 'Simpan Eselon' }).click();
  await expect(page.getByText(/Kode sudah digunakan/i)).toBeVisible();

  // Review Focus #5: Whitespace trim & uppercase
  await page.getByLabel(/Kode/i).fill('  esl-new  ');
  await page.getByRole('button', { name: 'Simpan Eselon' }).click();

  await expect(page).toHaveURL(/\/payroll\/eselon$/);
  await expect(page.locator('tr', { hasText: 'ESL-NEW' })).toBeVisible();
});

test('admin can re-activate a nonaktif eselon item via edit form', async ({ page }) => {
  await loginAs(page, 'admin');
  // Review Focus #2: Re-activating a soft-deleted item
  await page.goto('/payroll/eselon/NON-ESELON/ubah');
  await expect(page.getByRole('heading', { name: 'Ubah Eselon' })).toBeVisible();
  await expect(page.getByLabel(/Kode/i)).toBeDisabled();

  // Turn status switch on
  const switchBtn = page.getByRole('switch');
  await switchBtn.click();
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

  await expect(page).toHaveURL(/\/payroll\/eselon$/);
  const row = page.locator('tr', { hasText: 'NON-ESELON' });
  await expect(row.getByText('Aktif')).toBeVisible();
});
