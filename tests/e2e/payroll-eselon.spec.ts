import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('eselon page renders layout, breadcrumb, and five rows', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  const breadcrumb = page.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByText('Payroll')).toBeVisible();
  await expect(breadcrumb.getByText('Eselon / Level Jabatan')).toBeVisible();

  await expect(page.getByText('LANGKAH 3 DARI 16 • SETUP MASTER GAJI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Eselon / Level Jabatan', level: 1 })).toBeVisible();
  await expect(page.getByText('Level pekerjaan pegawai dan acuan hierarki jabatan.')).toBeVisible();

  await expect(page.getByText('Daftar Eselon / Level Jabatan')).toBeVisible();
  await expect(page.getByText('5 Level Terkonfigurasi')).toBeVisible();
  await expect(page.getByText('Menampilkan 5 dari 5 entri')).toBeVisible();

  const table = page.locator('table');
  for (const kode of ['ESELON-I', 'ESELON-II', 'ESELON-III', 'FUNG-AHLI', 'NON-ESELON']) {
    await expect(table.getByRole('cell', { name: kode, exact: true })).toBeVisible();
  }
  await expect(table.getByText('Direktur Utama / Pimpinan Tinggi')).toBeVisible();
  await expect(table.getByText('Tenaga Ahli Utama')).toBeVisible();
  await expect(table.getByText('Non-Eselon', { exact: true })).toBeVisible();
});

test('search filter matches kode or nama and resets counter', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await page.getByPlaceholder('Cari kode atau nama level jabatan...').fill('divisi');

  const table = page.locator('table');
  await expect(table.getByRole('cell', { name: 'ESELON-II', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'ESELON-I', exact: true })).toHaveCount(0);
  await expect(page.getByText('Menampilkan 1 dari 1 entri')).toBeVisible();
});

test('kategori filter combines with search using AND', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await page.getByPlaceholder('Cari kode atau nama level jabatan...').fill('ahli');
  await page.getByRole('combobox').first().selectOption('Fungsional');

  const table = page.locator('table');
  await expect(table.getByRole('cell', { name: 'FUNG-AHLI', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'ESELON-I', exact: true })).toHaveCount(0);
  await expect(page.getByText('Menampilkan 1 dari 1 entri')).toBeVisible();

  await page.getByRole('combobox').first().selectOption('Struktural');
  await expect(table.getByRole('cell', { name: 'FUNG-AHLI', exact: true })).toHaveCount(0);
  await expect(page.getByText('Tidak ada data eselon yang sesuai dengan filter.')).toBeVisible();
});

test('empty result shows zero counter', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await page.getByPlaceholder('Cari kode atau nama level jabatan...').fill('zzz');

  await expect(page.getByText('Menampilkan 0 dari 0 entri')).toBeVisible();
  await expect(page.getByText('Tidak ada data eselon yang sesuai dengan filter.')).toBeVisible();
});

test('tambah eselon navigates to form page and can cancel back to list', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await page.getByRole('button', { name: 'Tambah Eselon' }).click();
  await expect(page).toHaveURL(/\/payroll\/eselon\/tambah$/);
  await expect(page.getByRole('heading', { name: 'Tambah Eselon' })).toBeVisible();

  await page.getByRole('button', { name: 'Batal' }).click();
  await expect(page).toHaveURL(/\/payroll\/eselon$/);
});
