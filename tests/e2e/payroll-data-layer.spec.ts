import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('data layer loads default seed into localStorage and displays toast', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const loaded = await page.evaluate(async () => {
    const modRep = await import('/src/services/payrollRepositories.ts');
    const eselon = await modRep.eselonRepository.list();
    const grade = await modRep.gradeRepository.list();
    const komponen = await modRep.komponenRepository.list();

    const modToast = await import('/src/composables/useToast.ts');
    const { showToast } = modToast.useToast();
    showToast('Infrastruktur data siap', 'success');

    return { eselonCount: eselon.length, gradeCount: grade.length, komponenCount: komponen.length };
  });

  expect(loaded.eselonCount).toBe(5);
  expect(loaded.gradeCount).toBe(5);
  expect(loaded.komponenCount).toBe(5);
  await expect(page.getByText('Infrastruktur data siap')).toBeVisible();
});
