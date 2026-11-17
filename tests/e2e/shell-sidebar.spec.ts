import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin sidebar uses reference labels and active style', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const sidebar = page.locator('aside');
  for (const label of [
    'Dashboard Utama',
    'Absensi Kehadiran',
    'Perizinan Cuti',
    'Jadwal Roster',
    'Monitor Lembur',
  ]) {
    await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
  }

  await expect(sidebar.getByRole('link', { name: 'Dashboard Utama' })).toHaveCSS(
    'color',
    'rgb(0, 88, 190)'
  );
  await expect(sidebar.getByText('Keluar (Logout)')).toHaveCount(0);
  await expect(sidebar.getByText('Akses: Admin / HR')).toBeVisible();
  await expect(sidebar.getByText('Aktif')).toBeVisible();
});

test('employee sidebar uses employee labels', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/presensi/user');

  const sidebar = page.locator('aside');
  for (const label of ['Absensi Kehadiran', 'Perizinan Cuti', 'Jadwal Roster', 'Monitor Lembur']) {
    await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(sidebar.getByText('Keluar (Logout)')).toHaveCount(0);
});

test('sidebar does not overflow at 1280', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
