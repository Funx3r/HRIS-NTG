import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin attendance page has clickable in-page breadcrumb', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/presensi/admin');

  const main = page.locator('main');
  const breadcrumb = main.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByText('Monitoring Kehadiran')).toBeVisible();

  const parentLink = breadcrumb.getByRole('link', { name: 'Kehadiran' });
  await expect(parentLink).toBeVisible();
  await expect(parentLink).toHaveAttribute('href', '/presensi/admin');
});

test('employee cuti page has correct breadcrumb and link', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/cuti');

  const main = page.locator('main');
  const breadcrumb = main.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByRole('link', { name: 'Cuti' })).toBeVisible();
  await expect(breadcrumb.getByText('Manajemen Cuti')).toBeVisible();
  await expect(breadcrumb.getByText('Roster')).toHaveCount(0);
});

test('dashboard has clickable breadcrumb link', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const main = page.locator('main');
  const breadcrumb = main.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  const dashLink = breadcrumb.getByRole('link', { name: 'Dashboard' });
  await expect(dashLink).toBeVisible();
  await expect(dashLink).toHaveAttribute('href', '/dashboard');
});
