import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('utilitas tanggal roster menghitung periode dan minggu dengan benar', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const result = await page.evaluate(async () => {
    const mod = await import('/src/utils/rosterDate.ts');
    return {
      legacyDate: mod.toIsoDate('01 Nov 2026'),
      monthOnly: mod.toIsoDate('Oktober 2026'),
      invalidDate: mod.toIsoDate('bukan tanggal'),
      normalizedLegacy: mod.normalizeTeamPeriod('01 Nov 2026'),
      normalizedMonth: mod.normalizeTeamPeriod('Oktober 2026'),
      normalizedReversed: mod.normalizeTeamPeriod('2026-12-20', '2026-12-10'),
      sameMonthRange: mod.formatDateRange('2026-12-10', '2026-12-20'),
      crossMonthRange: mod.formatDateRange('2026-11-29', '2026-12-04'),
      crossYearRange: mod.formatDateRange('2026-12-29', '2027-01-04'),
      oneDayRange: mod.formatDateRange('2026-12-15', '2026-12-15'),
      weeks: mod.buildRosterWeeks('2026-12-10', '2026-12-20').map((w: any) => ({
        label: w.label,
        days: w.days.map((d: any) => `${d.date}:${d.dayName}:${d.isWeekend}`),
      })),
      oneDayWeeks: mod.buildRosterWeeks('2026-12-15', '2026-12-15').map((w: any) => ({
        label: w.label,
        count: w.days.length,
      })),
      reversedWeeks: mod.buildRosterWeeks('2026-12-20', '2026-12-10'),
    };
  });

  expect(result.legacyDate).toBe('2026-11-01');
  expect(result.monthOnly).toBe('2026-10-01');
  expect(result.invalidDate).toBeNull();
  expect(result.normalizedLegacy).toEqual({ startDate: '2026-11-01', endDate: '2026-11-30' });
  expect(result.normalizedMonth).toEqual({ startDate: '2026-10-01', endDate: '2026-10-31' });
  expect(result.normalizedReversed).toEqual({ startDate: '2026-12-20', endDate: '2026-12-20' });
  expect(result.sameMonthRange).toBe('10 - 20 Des 2026');
  expect(result.crossMonthRange).toBe('29 Nov - 4 Des 2026');
  expect(result.crossYearRange).toBe('29 Des 2026 - 4 Jan 2027');
  expect(result.oneDayRange).toBe('15 Des 2026');
  expect(result.weeks).toEqual([
    {
      label: '10 - 16 Des 2026',
      days: [
        '2026-12-10:Kam:false',
        '2026-12-11:Jum:false',
        '2026-12-12:Sab:true',
        '2026-12-13:Min:true',
        '2026-12-14:Sen:false',
        '2026-12-15:Sel:false',
        '2026-12-16:Rab:false',
      ],
    },
    {
      label: '17 - 20 Des 2026',
      days: [
        '2026-12-17:Kam:false',
        '2026-12-18:Jum:false',
        '2026-12-19:Sab:true',
        '2026-12-20:Min:true',
      ],
    },
  ]);
  expect(result.oneDayWeeks).toEqual([{ label: '15 Des 2026', count: 1 }]);
  expect(result.reversedWeeks).toEqual([]);
});

test('store roster menormalkan tanggal tim lama dan menyimpan perubahan status', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.addInitScript(() => {
    if (!localStorage.getItem('bmis_shared_roster_teams_v1')) {
      localStorage.setItem(
        'bmis_shared_roster_teams_v1',
        JSON.stringify([
          {
            id: 'legacy-team',
            orderNum: 1,
            title: 'Jadwal Legacy',
            divisi: 'Security',
            gedung: 'Gedung A',
            lantai: 'Lantai 4',
            startDate: '01 Nov 2026',
            status: 'Aktif',
            personelCount: 0,
            quotaMax: 5,
            members: [],
          },
        ])
      );
    }
  });
  await page.goto('/dashboard');

  const result = await page.evaluate(async () => {
    const mod = await import('/src/composables/useRosterStore.ts');
    const { teams, setTeamStatus } = mod.useRosterStore();
    const team = teams.value.find((t: any) => t.id === 'legacy-team');
    const changed = setTeamStatus('legacy-team', 'Draft');
    await new Promise((resolve) => setTimeout(resolve, 50));
    const stored = JSON.parse(localStorage.getItem('bmis_shared_roster_teams_v1') || '[]');
    const storedTeam = stored.find((t: any) => t.id === 'legacy-team');
    return {
      startDate: team?.startDate,
      endDate: team?.endDate,
      changed,
      status: team?.status,
      storedStatus: storedTeam?.status,
      storedEndDate: storedTeam?.endDate,
    };
  });

  expect(result.startDate).toBe('2026-11-01');
  expect(result.endDate).toBe('2026-11-30');
  expect(result.changed).toBe(true);
  expect(result.status).toBe('Draft');
  expect(result.storedStatus).toBe('Draft');
  expect(result.storedEndDate).toBe('2026-11-30');
});
