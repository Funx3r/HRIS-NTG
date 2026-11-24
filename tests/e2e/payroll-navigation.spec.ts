import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin sidebar shows payroll accordion and sub-items', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const sidebar = page.locator('aside');
  await expect(sidebar.getByText('Pengaturan Payroll')).toBeVisible();

  // Sub-item Komponen Gaji dan Grade Pegawai tampil
  await expect(sidebar.getByRole('link', { name: 'Komponen Gaji' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Grade Pegawai' })).toBeVisible();
});

test('admin can navigate to Komponen Gaji and see active style', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/komponen');

  await expect(page).toHaveURL(/\/payroll\/komponen/);
  const activeLink = page.locator('aside').getByRole('link', { name: 'Komponen Gaji' });
  await expect(activeLink).toHaveCSS('color', 'rgb(0, 88, 190)');
});

test('admin can navigate to Grade Pegawai and see active style', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/grade');

  await expect(page).toHaveURL(/\/payroll\/grade/);
  const activeLink = page.locator('aside').getByRole('link', { name: 'Grade Pegawai' });
  await expect(activeLink).toHaveCSS('color', 'rgb(0, 88, 190)');
});

test('employee cannot access payroll routes (redirected to presensi)', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/payroll/komponen');

  await expect(page).toHaveURL(/\/presensi\/user/);
  await expect(page.locator('aside').getByText('Pengaturan Payroll')).toHaveCount(0);
});

test('admin can navigate to Eselon and see active style', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await expect(page).toHaveURL(/\/payroll\/eselon/);
  const activeLink = page.locator('aside').getByRole('link', { name: 'Eselon / Level Jabatan' });
  await expect(activeLink).toHaveCSS('color', 'rgb(0, 88, 190)');
  await expect(page.locator('aside').getByRole('button', { name: 'Pengaturan Payroll' }))
    .toHaveAttribute('aria-expanded', 'true');
});

test('employee cannot access Eselon route', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/payroll/eselon');

  await expect(page).toHaveURL(/\/presensi\/user/);
  await expect(page.locator('aside').getByText('Eselon / Level Jabatan')).toHaveCount(0);
});

test('payroll sub-menu keeps sidebar within viewport width', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  const nav = page.locator('aside nav');
  await expect(nav.getByRole('link', { name: 'Eselon / Level Jabatan' })).toBeVisible();
  const overflows = await nav.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflows).toBe(false);
});

test('sidebar maintains active style when navigating inside payroll form route', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon/tambah');

  const activeLink = page.locator('aside').getByRole('link', { name: 'Eselon / Level Jabatan' });
  await expect(activeLink).toHaveCSS('color', 'rgb(0, 88, 190)');
});
