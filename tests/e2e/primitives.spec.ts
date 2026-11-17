import { test, expect } from '@playwright/test';

test('base primitives use design tokens', async ({ page }) => {
  await page.goto('/login');

  await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="probe-card" class="bmis-widget-card"></div>
      <input id="probe-input" class="form-input-custom" />
      <button id="probe-btn" class="btn-bmis btn-bmis-blue">Probe</button>
      `
    );
  });

  await expect(page.locator('#probe-card')).toHaveCSS('border-radius', '16px');
  await expect(page.locator('#probe-card')).toHaveCSS('border-color', 'rgb(226, 232, 240)');
  await expect(page.locator('#probe-btn')).toHaveCSS('background-color', 'rgb(0, 88, 190)');
  await expect(page.locator('#probe-btn')).toHaveCSS('height', '40px');
  await expect(page.locator('#probe-input')).toHaveCSS('border-color', 'rgb(226, 232, 240)');
});

test('admin attendance cards and buttons use standard tokens', async ({ page }) => {
  const { loginAs } = await import('./helpers');
  await loginAs(page, 'admin');
  await page.goto('/presensi/admin');

  const title = page.locator('main h1').first();
  await expect(title).toHaveText('Monitoring Kehadiran');
  await expect(title).toHaveClass(/text-2xl/);
  await expect(title).toHaveClass(/font-bold/);

  const manualBtn = page.getByRole('button', { name: /Masuk Manual/ });
  await expect(manualBtn).toBeVisible();
  await expect(manualBtn).not.toHaveClass(/bg-\[#547fff\]/);
});
