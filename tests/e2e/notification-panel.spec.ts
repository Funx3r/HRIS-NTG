import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('bell button opens notification panel', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const bell = page.getByRole('button', { name: 'Notifikasi' });
  await expect(bell).toBeVisible();

  // Panel belum ada
  await expect(page.locator('[data-testid="notif-panel"]')).toHaveCount(0);

  await bell.click();
  await expect(page.locator('[data-testid="notif-panel"]')).toBeVisible();
});

test('notification panel shows role-specific items for admin', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Notifikasi' }).click();

  const panel = page.locator('[data-testid="notif-panel"]');
  await expect(panel.getByText('Presensi Manual Tersimpan')).toBeVisible();
  await expect(panel.locator('[data-testid="notif-item"]')).toHaveCount(4);
});

test('mark all read clears badge count', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const badge = page.locator('[data-testid="notif-badge"]');
  await expect(badge).toBeVisible();

  await page.getByRole('button', { name: 'Notifikasi' }).click();
  await page.getByRole('button', { name: 'Tandai semua dibaca' }).click();

  await expect(badge).toHaveCount(0);
});

test('clicking outside panel closes it', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Notifikasi' }).click();
  await expect(page.locator('[data-testid="notif-panel"]')).toBeVisible();

  // Klik di luar panel (di elemen main)
  await page.locator('main').click({ position: { x: 50, y: 150 } });
  await expect(page.locator('[data-testid="notif-panel"]')).toHaveCount(0);
});

test('employee sees different notifications', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/presensi/user');
  await page.getByRole('button', { name: 'Notifikasi' }).click();

  const panel = page.locator('[data-testid="notif-panel"]');
  await expect(panel.getByText('Cuti Disetujui')).toBeVisible();
  await expect(panel.locator('[data-testid="notif-item"]')).toHaveCount(3);
});
