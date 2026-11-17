import { test, expect } from '@playwright/test';

test('login uses the existing branded layout', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Role: Admin Gedung' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Role: Karyawan' })).toBeVisible();
});

test('admin login redirects to admin attendance', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin_bmis');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/presensi\/admin$/);
});

test('employee login redirects to employee attendance', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('asep_milo');
  await page.getByLabel('Password').fill('pegawai123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/presensi\/user$/);
});

test('short credentials show validation error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('ab');
  await page.getByLabel('Password').fill('123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('alert')).toContainText('Username wajib diisi');
});
