import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('direct navigation to non-existent code redirects to list with error toast', async ({ page }) => {
  await loginAs(page, 'admin');
  // Review Focus #1: Direct navigation to edit route with non-existent code
  await page.goto('/payroll/eselon/KODE_TIDAK_ADA/ubah');

  await expect(page).toHaveURL(/\/payroll\/eselon$/);
  await expect(page.getByText('Data tidak ditemukan.')).toBeVisible();
});

test('employee is redirected when trying to access payroll form routes directly', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/payroll/eselon/tambah');
  await expect(page).toHaveURL(/\/presensi\/user/);

  await page.goto('/payroll/grade/tambah');
  await expect(page).toHaveURL(/\/presensi\/user/);

  await page.goto('/payroll/komponen/tambah');
  await expect(page).toHaveURL(/\/presensi\/user/);
});
