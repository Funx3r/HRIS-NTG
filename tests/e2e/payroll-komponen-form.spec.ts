import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin can create and edit komponen gaji with dropdown selections', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/komponen/tambah');

  await page.getByLabel(/Kode/i).fill('TJ_TRANSPORT');
  await page.getByLabel(/Nama/i).fill('Tunjangan Transportasi');
  await page.getByLabel(/Tipe/i).selectOption('Penghasilan');
  await page.getByLabel(/Sifat/i).selectOption('Tetap');
  await page.getByLabel(/Metode Hitung/i).selectOption('Nominal Tetap');
  await page.getByLabel(/Kena Pajak/i).check();
  await page.getByRole('button', { name: 'Simpan Komponen' }).click();

  await expect(page).toHaveURL(/\/payroll\/komponen$/);
  const row = page.locator('tr', { hasText: 'TJ_TRANSPORT' });
  await expect(row).toBeVisible();
  await expect(row.getByText('Tunjangan Transportasi')).toBeVisible();
  await expect(row.getByText('Ya')).toBeVisible();

  // Edit komponen
  await row.locator('button[aria-label="Ubah Komponen Gaji TJ_TRANSPORT"]').click();
  await expect(page).toHaveURL(/\/payroll\/komponen\/TJ_TRANSPORT\/ubah$/);
  await page.getByLabel(/Nama/i).fill('Tunjangan Transport Eksekutif');
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

  await expect(page).toHaveURL(/\/payroll\/komponen$/);
  await expect(page.locator('tr', { hasText: 'Tunjangan Transport Eksekutif' })).toBeVisible();
});
