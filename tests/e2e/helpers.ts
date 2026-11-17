import type { Page } from '@playwright/test';

export type AppRole = 'admin' | 'employee';

export const adminUser = {
  username: 'admin_bmis',
  name: 'Lucia Maria',
  initials: 'LM',
  role: 'admin' as const,
  roleLabel: 'Building Admin',
  superadmin: 1,
  id: 'usr-admin-1',
  nip: 'ADM.001',
  divisi: 'Manajemen Operasional',
};

export const employeeUser = {
  username: 'asep_milo',
  name: 'Asep Milo',
  initials: 'AM',
  role: 'employee' as const,
  roleLabel: 'Karyawan / Engineering',
  superadmin: 0,
  id: 'usr-employee-asep',
  nip: 'CS.50101',
  divisi: 'Engineering',
};

export async function loginAs(page: Page, role: AppRole): Promise<void> {
  const user = role === 'admin' ? adminUser : employeeUser;
  await page.addInitScript((value) => {
    localStorage.setItem('authenticated', 'true');
    localStorage.setItem('bmis_user', JSON.stringify(value));
  }, user);
}
