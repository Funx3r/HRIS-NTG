import { test, expect, type Page, type Locator } from '@playwright/test';
import { loginAs } from './helpers';

const openCreateModal = async (page: Page): Promise<Locator> => {
  await page.getByRole('button', { name: 'Tambah Jadwal Baru' }).first().click();
  const modal = page.locator('div.fixed.inset-0');
  await expect(modal.getByText('Buat Jadwal Shift Baru')).toBeVisible();
  return modal;
};

const fillCreateForm = async (
  modal: Locator,
  values: { title: string; start: string; end: string }
) => {
  await modal.locator('input[placeholder="Contoh: Tim 1 (Alpha)"]').fill(values.title);
  const selects = modal.locator('select');
  await selects.nth(0).selectOption({ index: 1 });
  await selects.nth(1).selectOption({ index: 1 });
  await selects.nth(2).selectOption({ index: 1 });
  const dates = modal.locator('input[type="date"]');
  await dates.nth(0).fill(values.start);
  await dates.nth(1).fill(values.end);
  await modal.locator('input[type="number"]').fill('2');
};

test('jadwal baru menyimpan periode dan tampil di kartu', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/roster/admin');
  const modal = await openCreateModal(page);
  await fillCreateForm(modal, {
    title: 'Jadwal Uji Periode',
    start: '2026-12-10',
    end: '2026-12-20',
  });
  await page.getByRole('button', { name: 'Simpan & Buat Jadwal' }).click();

  const card = page.locator('[data-testid="team-card"]').filter({ hasText: 'Jadwal Uji Periode' });
  await expect(card).toBeVisible();
  await expect(card.getByTestId('team-period')).toHaveText('10 - 20 Des 2026');

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('bmis_shared_roster_teams_v1') || '[]')
  );
  const created = stored.find((team: any) => team.title === 'Jadwal Uji Periode');
  expect(created.endDate).toBe('2026-12-20');
  expect(created.status).toBe('Draft');
});

test('tanggal selesai sebelum tanggal mulai ditolak', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/roster/admin');
  const modal = await openCreateModal(page);
  await fillCreateForm(modal, {
    title: 'Jadwal Uji Invalid',
    start: '2026-12-20',
    end: '2026-12-10',
  });
  await page.getByRole('button', { name: 'Simpan & Buat Jadwal' }).click();

  await expect(
    page.getByText('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.')
  ).toBeVisible();
  await expect(modal).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('bmis_shared_roster_teams_v1') || '[]')
  );
  expect(stored.some((team: any) => team.title === 'Jadwal Uji Invalid')).toBe(false);
});

interface SeedTeam {
  id: string;
  orderNum: number;
  title: string;
  divisi: string;
  gedung: string;
  lantai: string;
  startDate: string;
  endDate: string;
  status: 'Aktif' | 'Draft';
  personelCount: number;
  quotaMax: number;
  members: { initials: string; name: string; bgClass: string }[];
}

const makeTeam = (overrides: Partial<SeedTeam> & Pick<SeedTeam, 'id' | 'title'>): SeedTeam => ({
  orderNum: 1,
  divisi: 'Security',
  gedung: 'Gedung A',
  lantai: 'Lantai 4',
  startDate: '2026-12-10',
  endDate: '2026-12-20',
  status: 'Draft',
  personelCount: 0,
  quotaMax: 5,
  members: [],
  ...overrides,
});

const seedTeams = async (page: Page, teams: SeedTeam[]) => {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('bmis_shared_roster_teams_v1')) {
      localStorage.setItem('bmis_shared_roster_teams_v1', JSON.stringify(value));
    }
  }, teams);
};

test('matriks atur shift mengikuti periode dan minggu terakhir terpotong', async ({ page }) => {
  await loginAs(page, 'admin');
  await seedTeams(page, [
    makeTeam({
      id: 'team-range',
      title: 'Jadwal Uji Rentang',
      startDate: '2026-12-10',
      endDate: '2026-12-20',
    }),
  ]);
  await page.goto('/roster/admin');

  const card = page.locator('[data-testid="team-card"]').filter({ hasText: 'Jadwal Uji Rentang' });
  await card.getByRole('button', { name: 'Lihat Detail & Atur Personel' }).click();

  await expect(page).toHaveURL(/teamId=team-range/);
  await expect(page.getByTestId('schedule-period')).toHaveText('10 - 20 Des 2026');
  await expect(page.getByTestId('week-label')).toHaveText('Minggu 1 (10 - 16 Des 2026)');
  await expect(page.getByTestId('day-column')).toHaveCount(7);
  await expect(page.locator('[data-testid="day-column"][data-date="2026-12-10"]')).toBeVisible();
  await expect(page.locator('[data-testid="day-column"][data-date="2026-12-17"]')).toHaveCount(0);
  await expect(page.getByTestId('prev-week')).toBeDisabled();

  await page.getByTestId('next-week').click();
  await expect(page.getByTestId('week-label')).toHaveText('Minggu 2 (17 - 20 Des 2026)');
  await expect(page.getByTestId('day-column')).toHaveCount(4);
  await expect(page.locator('[data-testid="day-column"][data-date="2026-12-20"]')).toBeVisible();
  await expect(page.locator('[data-testid="day-column"][data-date="2026-12-21"]')).toHaveCount(0);
  await expect(page.getByTestId('next-week')).toBeDisabled();

  await page.getByTestId('prev-week').click();
  await expect(page.getByTestId('week-label')).toHaveText('Minggu 1 (10 - 16 Des 2026)');
});

test('matriks lama dengan kunci nomor hari dipetakan ke tanggal periode', async ({ page }) => {
  await loginAs(page, 'admin');
  await seedTeams(page, [
    makeTeam({
      id: 'team-migrate',
      title: 'Jadwal Uji Migrasi',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    }),
  ]);
  await page.addInitScript(() => {
    if (!localStorage.getItem('bmis_matrix_Jadwal Uji Migrasi')) {
      localStorage.setItem('bmis_matrix_Jadwal Uji Migrasi', JSON.stringify({ p1_5: 'S' }));
    }
  });
  await page.goto('/roster/admin');

  const card = page.locator('[data-testid="team-card"]').filter({ hasText: 'Jadwal Uji Migrasi' });
  await card.getByRole('button', { name: 'Lihat Detail & Atur Personel' }).click();

  await expect(page.getByTestId('shift-p1-2026-11-05-S')).toHaveClass(/bg-\[#0284c7\]/);
});

test('simpan dan aktifkan dari halaman detail mengubah status kartu menjadi Aktif', async ({ page }) => {
  await loginAs(page, 'admin');
  await seedTeams(page, [
    makeTeam({ id: 'team-status', title: 'Jadwal Uji Status', status: 'Draft' }),
  ]);
  await page.goto('/roster/admin');

  const card = page.locator('[data-testid="team-card"]').filter({ hasText: 'Jadwal Uji Status' });
  await expect(card.getByTestId('team-status')).toHaveText('Draft');
  await expect(card.getByTestId('team-number')).toHaveClass(/bg-\[#000000\]/);

  await card.getByRole('button', { name: 'Lihat Detail & Atur Personel' }).click();
  await page.getByRole('button', { name: 'Simpan dan Aktifkan Jadwal' }).click();
  await expect(page).toHaveURL(/\/roster\/admin$/);

  const activeCard = page.locator('[data-testid="team-card"]').filter({ hasText: 'Jadwal Uji Status' });
  await expect(activeCard.getByTestId('team-status')).toHaveText('Aktif');
  await expect(activeCard.getByTestId('team-number')).toHaveClass(/bg-\[#0084CC\]/);

  await page.reload();
  const reloadedCard = page.locator('[data-testid="team-card"]').filter({ hasText: 'Jadwal Uji Status' });
  await expect(reloadedCard.getByTestId('team-status')).toHaveText('Aktif');
});

test('simpan sebagai draf mengubah status tim aktif kembali menjadi Draft', async ({ page }) => {
  await loginAs(page, 'admin');
  await seedTeams(page, [
    makeTeam({ id: 'team-status-2', title: 'Jadwal Uji Draft', status: 'Aktif' }),
  ]);
  await page.goto('/roster/admin');

  const card = page.locator('[data-testid="team-card"]').filter({ hasText: 'Jadwal Uji Draft' });
  await card.getByRole('button', { name: 'Lihat Detail & Atur Personel' }).click();
  await page.getByRole('button', { name: 'Simpan sebagai Draf' }).click();
  await page.getByRole('button', { name: 'Kembali ke Beranda' }).click();

  const updatedCard = page.locator('[data-testid="team-card"]').filter({ hasText: 'Jadwal Uji Draft' });
  await expect(updatedCard.getByTestId('team-status')).toHaveText('Draft');
  await expect(updatedCard.getByTestId('team-number')).toHaveClass(/bg-\[#000000\]/);
});
