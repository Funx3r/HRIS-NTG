import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { adminUser, employeeUser } from './helpers';

const seedAdmin = async (page: import('@playwright/test').Page) => {
  await page.addInitScript((user) => {
    localStorage.setItem('authenticated', 'true');
    localStorage.setItem('bmis_user', JSON.stringify(user));
  }, adminUser);
};

const seedEmployee = async (page: import('@playwright/test').Page) => {
  await page.addInitScript((user) => {
    localStorage.setItem('authenticated', 'true');
    localStorage.setItem('bmis_user', JSON.stringify(user));
  }, employeeUser);
};

test('badge Approval Rencana berkurang setelah satu rencana disetujui', async ({ page }) => {
  await seedAdmin(page);
  await page.goto('/lembur/admin');

  const tab = page.getByRole('button', { name: /Approval Rencana/ });
  await tab.click();

  const badge = tab.locator('span.bg-amber-100');
  const before = Number((await badge.innerText()).trim());
  expect(before).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Setujui', exact: true }).first().click();

  await expect(badge).toHaveText(String(before - 1));
});

test('dropdown input manual tidak menduplikasi karyawan yang punya banyak record', async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem('authenticated', 'true');
    localStorage.setItem('bmis_user', JSON.stringify(user));
    if (!localStorage.getItem('bmis_shared_attendance_records')) {
      const base = {
        user_id: 'e107',
        employee_name: 'Dedi Supriyadi',
        employee_code: 'CS.34011',
        role_name: 'Housekeeping',
        check_in: null,
        check_out: null,
        late_duration_minutes: 0,
        status: 'ABSENT',
        location: '-',
      };
      localStorage.setItem(
        'bmis_shared_attendance_records',
        JSON.stringify([
          { ...base, date: '2026-11-26' },
          { ...base, date: '2026-11-25' },
          { ...base, date: '2026-11-24' },
        ])
      );
    }
  }, adminUser);

  await page.goto('/presensi/admin');
  await page.getByRole('button', { name: 'Masuk Manual' }).click();
  await expect(page.getByText('Input Presensi Manual Karyawan')).toBeVisible();

  const modal = page.locator('div.fixed.inset-0');
  const options = modal.locator('select').first().locator('option', { hasText: 'Dedi Supriyadi' });
  await expect(options).toHaveCount(1);
});

test('halaman Lembur tidak menampilkan tombol Ajukan Tukar Shift', async ({ page }) => {
  await seedEmployee(page);
  await page.goto('/lembur/user');
  await expect(page.getByRole('heading', { name: 'Monitoring Lembur' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Ajukan Tukar Shift' })).toHaveCount(0);
});

test('toast tukar shift menyebut atasan, bukan rekan kerja', () => {
  const roster = readFileSync('src/pages/roster/UserRoster.vue', 'utf8');
  expect(roster).toContain('ke atasan');

  const swapPage = readFileSync('src/pages/roster/UserTukarShift.vue', 'utf8');
  expect(swapPage).not.toContain('dikirim ke rekan');
  expect(swapPage).toContain('ke atasan');
});

test('Simpan dan Aktifkan Jadwal kembali ke halaman jadwal roster', async ({ page }) => {
  await seedAdmin(page);
  await page.goto('/roster/admin/atur-shift');

  await page.getByRole('button', { name: 'Simpan dan Aktifkan Jadwal' }).click();

  await expect(page).toHaveURL(/\/roster\/admin$/);
});

test('tim roster baru tetap ada setelah halaman di-refresh', async ({ page }) => {
  await seedAdmin(page);
  await page.goto('/roster/admin');

  const title = 'Tim Uji Persistensi';
  await page.getByRole('button', { name: 'Tambah Jadwal Baru' }).first().click();

  const modal = page.locator('div.fixed.inset-0');
  await expect(modal.getByText('Buat Jadwal Shift Baru')).toBeVisible();

  await page.locator('input[placeholder="Contoh: Tim 1 (Alpha)"]').fill(title);
  const selects = modal.locator('select');
  await selects.nth(0).selectOption({ index: 1 });
  await selects.nth(1).selectOption({ index: 1 });
  await selects.nth(2).selectOption({ index: 1 });

  const dateInputs = modal.locator('input[type="date"]');
  await dateInputs.nth(0).fill('2026-12-01');
  await dateInputs.nth(1).fill('2026-12-31');
  await modal.locator('input[type="number"]').fill('1');

  await page.getByRole('button', { name: 'Simpan & Buat Jadwal' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

test('tab kedua ikut tersinkron setelah check-in tanpa refresh manual', async ({ context }) => {
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  for (const p of [pageA, pageB]) {
    await p.addInitScript((user) => {
      localStorage.setItem('authenticated', 'true');
      localStorage.setItem('bmis_user', JSON.stringify(user));
    }, employeeUser);
  }

  await pageA.goto('/presensi/user');
  await pageB.goto('/presensi/user');

  await pageA.getByRole('button', { name: 'MASUK', exact: true }).click();

  // Di luar jam 08:00 aplikasi meminta alasan keterlambatan lebih dulu.
  const lateModalButton = pageA.getByRole('button', { name: 'Simpan & Masuk' });
  if (await lateModalButton.isVisible().catch(() => false)) {
    await lateModalButton.click();
  }

  await expect(pageA.getByRole('button', { name: /MASUK:/ })).toBeVisible();

  await expect(pageB.getByRole('button', { name: /MASUK:/ })).toBeVisible({ timeout: 5000 });
});
