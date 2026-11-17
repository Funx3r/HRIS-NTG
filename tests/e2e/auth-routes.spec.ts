import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('logged-out user can open forgot password and submit', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Lupa kata sandi?' }).click();
  await expect(page).toHaveURL(/\/lupa-kata-sandi$/);
  await expect(page.getByRole('heading', { name: 'Lupa Kata Sandi' })).toBeVisible();

  await page.getByLabel('Email Terdaftar').fill('admin@bmis.co.id');
  await page.getByRole('button', { name: 'Kirim Tautan Reset' }).click();

  await expect(page).toHaveURL(/\/tautan-terkirim$/);
  await expect(page.getByRole('heading', { name: 'Tautan Terkirim' })).toBeVisible();
});

test('authenticated admin is redirected away from auth pages', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/lupa-kata-sandi');
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('authenticated employee is redirected away from auth pages', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/tautan-terkirim');
  await expect(page).toHaveURL(/\/presensi\/user$/);
});
