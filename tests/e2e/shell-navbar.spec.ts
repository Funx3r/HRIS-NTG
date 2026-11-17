import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('navbar uses reference shell and keeps logout in profile menu', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const header = page.locator('header');
  await expect(header.getByText('Mode Admin')).toHaveCount(0);
  await expect(header.getByText('Mode Pegawai')).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Notifikasi' })).toHaveCount(1);
  await expect(header.locator('nav[aria-label="Breadcrumb"]')).toHaveCount(0);

  await header.getByRole('button', { name: /Lucia Maria/ }).click();
  const logout = header.getByRole('button', { name: /Keluar \(Logout\)/ });
  await expect(logout).toBeVisible();
  await logout.click();

  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('authenticated'))).toBeNull();
});

test('navbar header has no quick role toggle', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/presensi/user');

  const header = page.locator('header');
  await expect(header.getByText('Mode Admin')).toHaveCount(0);
  await expect(header.getByText('Mode Pegawai')).toHaveCount(0);
});

test('dev demo switch lives inside the profile menu', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const header = page.locator('header');
  await header.getByRole('button', { name: /Lucia Maria/ }).click();

  const demoSwitch = header.getByRole('button', { name: /Ganti akun demo: Pegawai/ });
  await expect(demoSwitch).toBeVisible();
  await demoSwitch.click();

  await expect(page).toHaveURL(/\/presensi\/user$/);
  await expect(header.getByText('Asep Milo')).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('bmis_user') || '{}').role)
  ).toBe('employee');
});
