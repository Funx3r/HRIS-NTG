import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('roster repositories initialize teams and shift swaps', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const { teamCount, swapCount } = await page.evaluate(async () => {
    const mod = await import('/src/services/rosterRepositories.ts');
    const teams = await mod.rosterTeamRepository.list();
    const swaps = await mod.shiftSwapRepository.list();
    return { teamCount: teams.length, swapCount: swaps.length };
  });

  expect(teamCount).toBeGreaterThan(0);
  expect(swapCount).toBeGreaterThan(0);
});
