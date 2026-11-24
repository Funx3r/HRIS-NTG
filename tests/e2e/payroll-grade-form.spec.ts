import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin can create and edit grade pegawai', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/grade/tambah');

  await page.getByLabel(/Kode/i).fill('GRADE-6');
  await page.getByLabel(/Urutan/i).fill('6');
  await page.getByLabel(/Nama/i).fill('Ahli Utama');
  await page.getByLabel(/Golongan ASN/i).fill('IV/e');
  await page.getByRole('button', { name: 'Simpan' }).click();

  await expect(page).toHaveURL(/\/payroll\/grade$/);
  await expect(page.locator('tr', { hasText: 'GRADE-6' })).toBeVisible();
  await expect(page.locator('tr', { hasText: 'IV/e' })).toBeVisible();

  // Edit grade
  await page.locator('tr', { hasText: 'GRADE-6' }).locator('button[aria-label="Ubah Grade Pegawai GRADE-6"]').click();
  await expect(page).toHaveURL(/\/payroll\/grade\/GRADE-6\/ubah$/);
  await page.getByLabel(/Nama/i).fill('Ahli Utama Senior');
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

  await expect(page).toHaveURL(/\/payroll\/grade$/);
  await expect(page.locator('tr', { hasText: 'Ahli Utama Senior' })).toBeVisible();
});
