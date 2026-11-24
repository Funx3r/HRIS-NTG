import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('grade pegawai renders complete layout and breadcrumb', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/grade');

  // Breadcrumb
  const breadcrumb = page.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByText('Payroll')).toBeVisible();
  await expect(breadcrumb.getByText('Grade Pegawai')).toBeVisible();

  // Header & Step
  await expect(page.getByText('LANGKAH 2 DARI 16 • SETUP MASTER GAJI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Grade Pegawai', level: 1 })).toBeVisible();
  await expect(page.getByText('Tingkatan grade untuk menentukan gaji pokok')).toBeVisible();

  // Summary Card
  await expect(page.getByText('Daftar Grade Pegawai')).toBeVisible();
  await expect(page.getByText('5 Grade Terkonfigurasi')).toBeVisible();
  await expect(page.getByText('Sinkronisasi Matriks Gaji')).toBeVisible();

  // Table rows
  const table = page.locator('table');
  await expect(table.getByText('GRADE-1')).toBeVisible();
  await expect(table.getByText('Pelaksana Pemula')).toBeVisible();
  await expect(table.getByText('GRADE-3')).toBeVisible();
  await expect(table.getByText('Pelaksana Mahir')).toBeVisible();
  await expect(table.getByText('GRADE-KONTRAK')).toBeVisible();
});

test('search filter works on kode or nama grade', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/grade');

  const searchInput = page.getByPlaceholder('Cari kode atau nama grade...');
  await searchInput.fill('mahir');

  await expect(page.locator('table').getByText('GRADE-3')).toBeVisible();
  await expect(page.locator('table').getByText('GRADE-1')).toHaveCount(0);
});

test('tambah button navigates to form page and can cancel back to list', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/grade');

  await page.getByRole('button', { name: 'Tambah Grade' }).click();
  await expect(page).toHaveURL(/\/payroll\/grade\/tambah$/);
  await expect(page.getByRole('heading', { name: 'Tambah Grade' })).toBeVisible();

  await page.getByRole('button', { name: 'Batal' }).click();
  await expect(page).toHaveURL(/\/payroll\/grade$/);
});
