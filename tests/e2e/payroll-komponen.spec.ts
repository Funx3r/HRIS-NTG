import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('komponen gaji renders complete layout and breadcrumb', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/komponen');

  // Breadcrumb
  const breadcrumb = page.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByText('Payroll')).toBeVisible();
  await expect(breadcrumb.getByText('Komponen Gaji')).toBeVisible();

  // Header
  await expect(page.getByRole('heading', { name: 'Komponen Gaji', level: 1 })).toBeVisible();
  await expect(page.getByText('Daftar komponen penghasilan dan potongan')).toBeVisible();

  // Card summary & badge
  await expect(page.getByText('Daftar Komponen Gaji')).toBeVisible();
  await expect(page.getByText('5 Komponen Terkonfigurasi')).toBeVisible();
  await expect(page.getByText('Sesuai Regulasi PPh 21 TER 2024')).toBeVisible();

  // Table rows
  const table = page.locator('table');
  await expect(table.getByText('GAJPOK')).toBeVisible();
  await expect(table.getByText('Gaji Pokok')).toBeVisible();
  await expect(table.getByText('TJ_JABATAN')).toBeVisible();
  await expect(table.getByText('UANG_MAKAN')).toBeVisible();
  await expect(table.getByText('BPJS_KES_PRS')).toBeVisible();
  await expect(table.getByRole('cell', { name: 'KASBON', exact: true })).toBeVisible();
});

test('search filter works on kode or nama', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/komponen');

  const searchInput = page.getByPlaceholder('Cari kode atau nama komponen...');
  await searchInput.fill('makan');

  await expect(page.locator('table').getByText('UANG_MAKAN')).toBeVisible();
  await expect(page.locator('table').getByText('GAJPOK')).toHaveCount(0);

  // Counter menampilkan 1 entri
  await expect(page.getByText('Menampilkan 1 dari 1 entri')).toBeVisible();
});

test('tambah button opens development stub modal', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/komponen');

  await page.getByRole('button', { name: 'Tambah Komponen' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Form Tambah Komponen Gaji')).toBeVisible();

  // Tutup modal
  await page.getByRole('button', { name: 'Tutup' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
