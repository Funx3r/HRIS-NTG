# HRIS Visual Alignment Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyamakan token visual, shell `Sidebar`/`Navbar`, dan halaman auth aplikasi HRIS dengan FigCraft sebagai acuan visual, tanpa memindahkan logout dari dropdown profil.

**Architecture:** Token warna dan font menjadi satu sumber di `src/style.css`, dipetakan ke Tailwind di `tailwind.config.js`. Shell dan auth memakai token itu. Test Playwright menjaga perilaku route, label navigasi, redirect role, dan lokasi logout. Halaman fitur lain belum disentuh pada milestone ini.

**Tech Stack:** Vue 3.5, TypeScript, Vue Router 4, Tailwind CSS 3.4, Vite 8, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-17-hris-visual-alignment-foundation-design.md`

## Global Constraints

- Workdir: `C:\Users\ASUS\Concept\HRIS-NTG`.
- Font: `Hanken Grotesk`, fallback `Inter`, sistem sans-serif.
- Primary: `#0058BE`; hover `#004BA3`; pressed `#003E87`.
- Background: `#F8F9FA`; border: `#E2E8F0`; text: `#0F172A`; muted: `#64748B`.
- Logout tetap di dropdown profil `Navbar`. Tidak ada tombol logout di sidebar.
- Demo switch hanya di dropdown profil dan hanya saat `import.meta.env.DEV`. Tidak ada toggle role di header atau sidebar.
- Footer sidebar tetap menampilkan status akses dan indikator `Aktif`.
- Jangan mengubah autentikasi menjadi backend/API nyata.
- Jangan menyentuh halaman fitur di luar shell dan auth pada plan ini.
- Setiap task berakhir dengan test yang relevan lolos dan commit sendiri.

## Review Focus

- Label sidebar panjang (`Absensi Kehadiran`, `Perizinan Cuti`) tidak boleh overflow saat font Hanken dimuat; test ada di Task 4.
- User yang sudah login tidak boleh membuka `/login`, `/lupa-kata-sandi`, atau `/tautan-terkirim`; test ada di Task 7.
- Validasi login dan redirect role harus tetap benar; test ada di Task 6.
- Logout harus tetap bisa dijangkau dari dropdown profil dan menghapus sesi; demo switch harus ada di dropdown yang sama saat dev; test ada di Task 5.
- Font fallback harus tetap terbaca kalau Google Fonts gagal; test ada di Task 2.

---

### Task 1: Playwright Test Harness

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/helpers.ts`
- Create: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `loginAs(page: Page, role: 'admin' | 'employee'): Promise<void>`
- Produces: `adminUser` and `employeeUser` fixtures
- Produces: npm scripts `test:e2e`, `test:e2e:ui`

- [ ] **Step 1: Install Playwright**

Run:

```bash
npm install -D @playwright/test@^1.50.0
npx playwright install chromium
```

- [ ] **Step 2: Add npm scripts**

Add to `package.json`:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
```

- [ ] **Step 4: Create `tests/e2e/helpers.ts`**

```ts
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
```

- [ ] **Step 5: Create `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('app boots and serves the login route', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page).toHaveTitle(/BMIS/);
});
```

- [ ] **Step 6: Run the smoke test**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`  
Expected: PASS, 1 test.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e/helpers.ts tests/e2e/smoke.spec.ts
git commit -m "test: add playwright harness"
```

---

### Task 2: Design Tokens and Typography

**Files:**
- Modify: `src/style.css`
- Modify: `tailwind.config.js`
- Modify: `index.html`
- Create: `tests/e2e/tokens.spec.ts`

**Interfaces:**
- Produces: CSS variables `--bmis-bg`, `--bmis-primary`, `--bmis-border`, `--bmis-text`, `--bmis-body`, `--bmis-muted`, `--bmis-success`, `--bmis-error`.
- Produces: Tailwind colors `bmis-bg`, `bmis-surface`, `bmis-primary`, `bmis-cyan`, `bmis-sky`, `bmis-success`, `bmis-warning`, `bmis-error`.
- Produces: Tailwind `fontFamily.sans` starts with `Hanken Grotesk`.

- [ ] **Step 1: Write the failing token test**

Create `tests/e2e/tokens.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('design tokens and font are applied', async ({ page }) => {
  await page.goto('/login');

  const values = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return {
      primary: root.getPropertyValue('--bmis-primary').trim(),
      bg: root.getPropertyValue('--bmis-bg').trim(),
      bodyBg: body.backgroundColor,
      bodyColor: body.color,
      font: body.fontFamily,
    };
  });

  expect(values.primary.toLowerCase()).toBe('#0058be');
  expect(values.bg.toLowerCase()).toBe('#f8f9fa');
  expect(values.bodyBg).toBe('rgb(248, 249, 250)');
  expect(values.bodyColor).toBe('rgb(15, 23, 42)');
  expect(values.font).toContain('Hanken Grotesk');
  expect(values.font).toContain('Inter');
});

test('login shell stays usable when google fonts is blocked', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());

  await page.goto('/login');
  await expect(page.locator('#app')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/tokens.spec.ts`  
Expected: FAIL because `--bmis-primary` is empty and body font is Montserrat.

- [ ] **Step 3: Replace the `:root` token block in `src/style.css`**

Keep the existing `--shift-*` and `--badge-*` variables below this block unchanged.

```css
:root {
  --bmis-bg: #F8F9FA;
  --bmis-surface: #FFFFFF;
  --bmis-surface-muted: #F3F4F6;
  --bmis-border: #E2E8F0;
  --bmis-text: #0F172A;
  --bmis-body: #46464D;
  --bmis-muted: #64748B;
  --bmis-disabled: #94A3B8;

  --bmis-primary: #0058BE;
  --bmis-primary-hover: #004BA3;
  --bmis-primary-pressed: #003E87;
  --bmis-cyan: #27AFCD;
  --bmis-teal: #279FAA;
  --bmis-sky: #0284C7;
  --bmis-blue-container: #D8E2FF;
  --bmis-on-blue-container: #001A42;

  --bmis-success: #10B981;
  --bmis-success-text: #047857;
  --bmis-warning: #F59E0B;
  --bmis-error: #EF4444;
  --bmis-error-text: #BA1A1A;
  --bmis-accent: #FFCC00;

  --bmis-card: var(--bmis-surface);
  --bmis-blue: var(--bmis-primary);
  --bmis-blue-hover: var(--bmis-primary-hover);
  --bmis-blue-light: var(--bmis-blue-container);
  --bmis-green: var(--bmis-success);
  --bmis-green-hover: var(--bmis-success-text);
  --bmis-green-light: #ECFDF5;
  --bmis-teal-hover: #1F8791;
  --bmis-teal-light: #E6F6F3;
  --bmis-teal-border: #BCE6DC;
  --bmis-yellow: var(--bmis-warning);
  --bmis-yellow-light: #FEF3C7;
  --bmis-red: var(--bmis-error);
  --bmis-red-light: #FEE2E2;
  --bmis-label: var(--bmis-body);
  --bmis-table-header: var(--bmis-border);
  --bmis-purple: #7C5CB4;
  --bmis-purple-light: #EEE7F8;
}
```

- [ ] **Step 4: Update body typography in `src/style.css`**

Replace the Google Fonts `@import` with no import. Set:

```css
body {
  margin: 0;
  font-family: 'Hanken Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--bmis-bg);
  color: var(--bmis-text);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 5: Map Tailwind colors to the CSS variables**

In `tailwind.config.js`, replace the `colors` block with:

```js
colors: {
  'bmis-bg': 'var(--bmis-bg)',
  'bmis-card': 'var(--bmis-card)',
  'bmis-surface': 'var(--bmis-surface)',
  'bmis-surface-muted': 'var(--bmis-surface-muted)',
  'bmis-border': 'var(--bmis-border)',
  'bmis-text': 'var(--bmis-text)',
  'bmis-body': 'var(--bmis-body)',
  'bmis-label': 'var(--bmis-label)',
  'bmis-muted': 'var(--bmis-muted)',
  'bmis-disabled': 'var(--bmis-disabled)',
  'bmis-primary': 'var(--bmis-primary)',
  'bmis-primary-hover': 'var(--bmis-primary-hover)',
  'bmis-primary-pressed': 'var(--bmis-primary-pressed)',
  'bmis-cyan': 'var(--bmis-cyan)',
  'bmis-teal': 'var(--bmis-teal)',
  'bmis-teal-hover': 'var(--bmis-teal-hover)',
  'bmis-teal-light': 'var(--bmis-teal-light)',
  'bmis-teal-border': 'var(--bmis-teal-border)',
  'bmis-sky': 'var(--bmis-sky)',
  'bmis-blue': 'var(--bmis-blue)',
  'bmis-blue-hover': 'var(--bmis-blue-hover)',
  'bmis-blue-light': 'var(--bmis-blue-light)',
  'bmis-blue-container': 'var(--bmis-blue-container)',
  'bmis-on-blue-container': 'var(--bmis-on-blue-container)',
  'bmis-green': 'var(--bmis-green)',
  'bmis-green-hover': 'var(--bmis-green-hover)',
  'bmis-green-light': 'var(--bmis-green-light)',
  'bmis-yellow': 'var(--bmis-yellow)',
  'bmis-yellow-light': 'var(--bmis-yellow-light)',
  'bmis-red': 'var(--bmis-red)',
  'bmis-red-light': 'var(--bmis-red-light)',
  'bmis-success': 'var(--bmis-success)',
  'bmis-success-text': 'var(--bmis-success-text)',
  'bmis-warning': 'var(--bmis-warning)',
  'bmis-error': 'var(--bmis-error)',
  'bmis-error-text': 'var(--bmis-error-text)',
  'bmis-accent': 'var(--bmis-accent)',
  'bmis-purple': 'var(--bmis-purple)',
  'bmis-purple-light': 'var(--bmis-purple-light)',
},
```

Set `fontFamily.sans` to:

```js
sans: ['Hanken Grotesk', 'Inter', '-apple-system', 'sans-serif'],
```

- [ ] **Step 6: Update the font link and body text class in `index.html`**

Change `<body class="bg-bmis-bg antialiased text-slate-800">` to `<body class="bg-bmis-bg antialiased text-bmis-text">`.

Replace the Montserrat/Inter link with:

```html
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 7: Run the token test and build**

Run: `npm run test:e2e -- tests/e2e/tokens.spec.ts`  
Expected: PASS.

Run: `npm run build`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/style.css tailwind.config.js index.html tests/e2e/tokens.spec.ts
git commit -m "style: add design tokens and hanken grotesk"
```

---

### Task 3: Base UI Primitives

**Files:**
- Modify: `src/style.css`
- Create: `tests/e2e/primitives.spec.ts`

**Interfaces:**
- Produces: `.bmis-widget-card` with `border: 1px solid var(--bmis-border)`, `border-radius: 16px`.
- Produces: `.btn-bmis` height `40px`, radius `8px`.
- Produces: `.btn-bmis-blue` background `var(--bmis-primary)`.
- Produces: `.form-input-custom` and `.form-select-custom` border `var(--bmis-border)`, focus `var(--bmis-primary)`.
- Produces: `.form-label-custom` normal-case, `12px`, weight `600`.
- Produces: `.page-heading` `24px`, weight `700`, color `var(--bmis-text)`.

- [ ] **Step 1: Write the failing primitive test**

Create `tests/e2e/primitives.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/primitives.spec.ts`  
Expected: FAIL because the button background is still `#547FFF` and height is `38px`.

- [ ] **Step 3: Update the base classes in `src/style.css`**

Set these values:

```css
.page-heading {
  font-size: 24px;
  font-weight: 700;
  color: var(--bmis-text);
  margin: 0;
  line-height: 1.3;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--bmis-text);
}

.widget-sub-desc {
  font-size: 14px;
  color: var(--bmis-muted);
  margin-bottom: 16px;
  line-height: 1.5;
}

.bmis-widget-card {
  background: var(--bmis-surface);
  border-radius: 16px;
  border: 1px solid var(--bmis-border);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  padding: 20px 24px;
  margin-bottom: 20px;
}

.form-select-custom,
.form-input-custom {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--bmis-border);
  padding: 0 12px;
  font-size: 13px;
  color: var(--bmis-text);
  background-color: var(--bmis-surface);
  outline: none;
  transition: all 0.15s ease-in-out;
}

.form-select-custom:focus,
.form-input-custom:focus {
  border-color: var(--bmis-primary);
  box-shadow: 0 0 0 3px rgba(0, 88, 190, 0.15);
}

.form-label-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--bmis-body);
  margin-bottom: 6px;
  text-transform: none;
  letter-spacing: 0;
}

.required-tag {
  color: var(--bmis-error-text);
  font-size: 11px;
  font-weight: 700;
}

.btn-bmis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
}

.btn-bmis-blue {
  background: var(--bmis-primary);
  color: #FFFFFF;
}

.btn-bmis-blue:hover {
  background: var(--bmis-primary-hover);
}

.btn-bmis-teal {
  background: var(--bmis-teal);
  color: #FFFFFF;
}

.btn-bmis-teal:hover {
  background: var(--bmis-teal-hover);
}
```

Keep the other button variants (`yellow`, `purple`, `green`, `red`) but change their hover colors to token values where the variant still exists.

- [ ] **Step 4: Run the primitive test**

Run: `npm run test:e2e -- tests/e2e/primitives.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/style.css tests/e2e/primitives.spec.ts
git commit -m "style: align base ui primitives"
```

---

### Task 4: Sidebar Shell

**Files:**
- Modify: `src/components/layout/Sidebar.vue`
- Create: `tests/e2e/shell-sidebar.spec.ts`

**Interfaces:**
- Consumes: `loginAs` from `tests/e2e/helpers.ts`.
- Produces: nav labels `Dashboard Utama`, `Absensi Kehadiran`, `Perizinan Cuti`, `Jadwal Roster`, `Monitor Lembur`.
- Produces: helper `navItemClass(active: boolean): string` and `subItemClass(active: boolean): string` inside `Sidebar.vue`.
- Guarantees: no logout button inside `<aside>`; footer access status stays.

- [ ] **Step 1: Write the failing sidebar tests**

Create `tests/e2e/shell-sidebar.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin sidebar uses reference labels and active style', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const sidebar = page.locator('aside');
  for (const label of [
    'Dashboard Utama',
    'Absensi Kehadiran',
    'Perizinan Cuti',
    'Jadwal Roster',
    'Monitor Lembur',
  ]) {
    await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
  }

  await expect(sidebar.getByRole('link', { name: 'Dashboard Utama' })).toHaveCSS(
    'color',
    'rgb(0, 88, 190)'
  );
  await expect(sidebar.getByText('Keluar (Logout)')).toHaveCount(0);
  await expect(sidebar.getByText('Akses: Admin / HR')).toBeVisible();
  await expect(sidebar.getByText('Aktif')).toBeVisible();
});

test('employee sidebar uses employee labels', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/presensi/user');

  const sidebar = page.locator('aside');
  for (const label of ['Absensi Kehadiran', 'Perizinan Cuti', 'Jadwal Roster', 'Monitor Lembur']) {
    await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(sidebar.getByText('Keluar (Logout)')).toHaveCount(0);
});

test('sidebar does not overflow at 1280', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/shell-sidebar.spec.ts`  
Expected: FAIL because current labels are `Dashboard`, `Kehadiran & Presensi`, `Cuti`, `Roster`, `Lembur`.

- [ ] **Step 3: Refactor `Sidebar.vue` class helpers**

Add in `<script setup>`:

```ts
const navItemClass = (active: boolean) =>
  [
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
    active
      ? 'text-bmis-primary'
      : 'text-bmis-body hover:bg-bmis-surface-muted hover:text-bmis-primary',
  ].join(' ');

const subItemClass = (active: boolean) =>
  [
    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
    active
      ? 'text-bmis-primary font-semibold'
      : 'text-bmis-muted hover:bg-bmis-surface-muted hover:text-bmis-primary',
  ].join(' ');
```

Use these helpers on every nav link and accordion button. Set `aria-current="page"` when active.

- [ ] **Step 4: Rename labels and remove active pills**

Replace labels:

- `Dashboard` → `Dashboard Utama`
- `Kehadiran & Presensi` → `Absensi Kehadiran`
- `Cuti` → `Perizinan Cuti`
- `Roster` → `Jadwal Roster`
- `Lembur` → `Monitor Lembur`
- Admin submenu `Monitoring Kehadiran` and `Presensi Mandiri` stay.
- Roster submenu `Jadwal Kerja` and `Tukar Shift` stay.

Remove `bg-blue-50`, `text-bmis-blue`, and `shadow-xs` active pill classes. Active state is primary text only.

- [ ] **Step 5: Restyle the shell**

- `aside`: `bg-white border-r border-bmis-border`.
- Brand area: `px-6 py-4 border-b border-bmis-border`.
- Nav: `px-3 py-4 space-y-1 overflow-y-auto`.
- Footer: `p-4 border-t border-bmis-border bg-bmis-surface-muted`.
- Access text: `text-[11px] text-bmis-muted`.
- `Aktif`: `text-bmis-success-text`, dot `bg-bmis-success`.

Do not add a logout button to the footer.

- [ ] **Step 6: Clean unused icon imports**

Remove imports no longer used after refactor. Keep only icons referenced by the template.

- [ ] **Step 7: Run sidebar tests and build**

Run: `npm run test:e2e -- tests/e2e/shell-sidebar.spec.ts`  
Expected: PASS.

Run: `npm run build`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/Sidebar.vue tests/e2e/shell-sidebar.spec.ts
git commit -m "feat: align sidebar shell with design reference"
```

---

### Task 5: Navbar Shell and Logout Placement

**Files:**
- Modify: `src/components/layout/Navbar.vue`
- Modify: `src/router/index.ts`
- Create: `tests/e2e/shell-navbar.spec.ts`

**Interfaces:**
- Consumes: `loginAs` from `tests/e2e/helpers.ts`.
- Produces: route meta `breadcrumbParent?: string`, `breadcrumb?: string`.
- Guarantees: one notification button; no `Mode Admin` / `Mode Pegawai` toggle in the header; logout stays in profile dropdown; dev-only `Ganti akun demo` lives in the same dropdown.

- [ ] **Step 1: Write the failing navbar tests**

Create `tests/e2e/shell-navbar.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('navbar uses reference shell and keeps logout in profile menu', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const header = page.locator('header');
  await expect(header.getByText('Mode Admin')).toHaveCount(0);
  await expect(header.getByText('Mode Pegawai')).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Notifikasi' })).toHaveCount(1);
  await expect(header.getByText('Dashboard')).toBeVisible();
  await expect(header.getByText('Monitoring Operasional')).toBeVisible();

  await header.getByRole('button', { name: /Lucia Maria/ }).click();
  const logout = header.getByRole('button', { name: /Keluar \(Logout\)/ });
  await expect(logout).toBeVisible();
  await logout.click();

  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('authenticated'))).toBeNull();
});

test('navbar header has no quick role toggle', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/presensi/user');

  const header = page.locator('header');
  await expect(header.getByText('Mode Admin')).toHaveCount(0);
  await expect(header.getByText('Mode Pegawai')).toHaveCount(0);
});

test('dev demo switch lives inside the profile menu', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const header = page.locator('header');
  await header.getByRole('button', { name: /Lucia Maria/ }).click();

  const demoSwitch = header.getByRole('button', { name: /Ganti akun demo: Pegawai/ });
  await expect(demoSwitch).toBeVisible();
  await demoSwitch.click();

  await expect(page).toHaveURL(/\/presensi\/user$/);
  await expect(header.getByText('Asep Milo')).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('bmis_user') || '{}').role)
  ).toBe('employee');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/shell-navbar.spec.ts`  
Expected: FAIL because the header still renders `Mode Admin` and `Mode Pegawai`, the breadcrumb is not in the header, and the profile menu has no `Ganti akun demo` item.

- [ ] **Step 3: Add breadcrumb metadata to routes**

In `src/router/index.ts`, add meta values:

| Path | `breadcrumbParent` | `breadcrumb` |
|---|---|---|
| `/dashboard` | `Dashboard` | `Monitoring Operasional` |
| `/presensi/user` | `Kehadiran` | `Presensi Mandiri` |
| `/presensi/admin` | `Kehadiran` | `Monitoring Kehadiran` |
| `/roster/admin` | `Roster` | `Jadwal Kerja` |
| `/roster/admin/atur-shift` | `Roster` | `Atur Shift` |
| `/roster/tambah` | `Roster` | `Tambah Jadwal` |
| `/roster/tukar-shift` | `Roster` | `Tukar Shift` |
| `/roster/user` | `Roster` | `Jadwal Roster` |
| `/cuti` | `Cuti` | `Manajemen Cuti` |
| `/cuti/admin` | `Cuti` | `Manajemen Cuti` |
| `/lembur/admin` | `Lembur` | `Rekap & Otorisasi Lembur` |
| `/lembur/user` | `Lembur` | `Monitoring Lembur` |

- [ ] **Step 4: Replace the left header block**

In `Navbar.vue`, compute:

```ts
const breadcrumbParent = computed(() => route.meta.breadcrumbParent as string | undefined);
const breadcrumb = computed(
  () => (route.meta.breadcrumb as string | undefined) ?? (route.name as string | undefined)
);
```

Render:

```html
<nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs">
  <span v-if="breadcrumbParent" class="text-bmis-muted">{{ breadcrumbParent }}</span>
  <ChevronRight v-if="breadcrumbParent" :size="14" class="text-bmis-disabled" />
  <span class="font-semibold text-bmis-sky">{{ breadcrumb }}</span>
</nav>
```

Remove the `BMIS Presensi` badge and the entire role-toggle button group.

- [ ] **Step 5: Keep demo switch code and gate it to dev**

Keep `switchToAdmin`, `switchToEmployee`, `switchRole`, and the `userRole` ref with its assignment in `syncUser`. Add:

```ts
const isDev = import.meta.env.DEV;
```

Update the `switchToEmployee` payload so it matches the login demo account:

```ts
{
  username: 'asep_milo',
  name: 'Asep Milo',
  initials: 'AM',
  role: 'employee',
  roleLabel: 'Karyawan / Engineering',
  superadmin: 0,
  id: 'usr-employee-asep',
  nip: 'CS.50101',
  divisi: 'Engineering',
}
```

Remove the `ShieldCheck` import because the header badge is gone. Keep `ArrowLeftRight` for the demo switch. Add `computed` to the Vue import, import `useRoute` from `vue-router`, and add `ChevronRight` to the icon import.

- [ ] **Step 6: Replace the two notification bells with one button**

```html
<button
  type="button"
  aria-label="Notifikasi"
  class="relative flex h-9 w-9 items-center justify-center rounded-full border border-bmis-border bg-white text-bmis-body hover:bg-bmis-surface-muted"
>
  <Bell :size="16" />
  <span class="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-bmis-warning"></span>
</button>
```

- [ ] **Step 7: Restyle profile and dropdown**

- `header`: `h-16 bg-white border-b border-bmis-border px-8`.
- Avatar: `bg-bmis-primary text-white`.
- Name: `text-sm font-semibold text-bmis-text`.
- Role: `text-[11px] text-bmis-muted`.
- Menu: white, border `border-bmis-border`, radius 12.
- Add the dev-only demo switch above logout:

```html
<button
  v-if="isDev"
  type="button"
  @click="switchRole"
  class="w-full text-left px-3.5 py-2.5 text-bmis-body hover:bg-bmis-surface-muted flex items-center gap-2 font-semibold transition-colors"
>
  <ArrowLeftRight :size="14" class="text-bmis-primary" />
  <span>Ganti akun demo: {{ userRole === 'admin' ? 'Pegawai' : 'Admin' }}</span>
</button>
```

- Keep `Keluar (Logout)` as the last action with `border-t border-bmis-border` and `text-bmis-error-text`.

- [ ] **Step 8: Run navbar tests and build**

Run: `npm run test:e2e -- tests/e2e/shell-navbar.spec.ts`  
Expected: PASS.

Run: `npm run build`  
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/layout/Navbar.vue src/router/index.ts tests/e2e/shell-navbar.spec.ts
git commit -m "feat: align navbar shell and move demo switch to profile menu"
```

---

### Task 6: Login Page and Auth States

**Files:**
- Modify: `src/pages/login/Login.vue`
- Delete: `src/pages/auth/Login.vue`
- Modify: `README.md`
- Create: `tests/e2e/login.spec.ts`

**Interfaces:**
- Consumes: `.btn-bmis`, `.form-input-custom`, tokens from earlier tasks.
- Produces: heading `Masuk ke BMIS`, labels `Username` and `Kata Sandi`, link `Lupa kata sandi?`, button `Masuk`.
- Produces: `data-testid="login-brand-panel"` on the dark brand panel.
- Guarantees: admin login goes to `/presensi/admin`; employee login goes to `/presensi/user`.

- [ ] **Step 1: Write the failing login tests**

Create `tests/e2e/login.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('login uses the reference layout', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Masuk ke BMIS' })).toBeVisible();
  await expect(page.getByTestId('login-brand-panel')).toBeVisible();
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Kata Sandi')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lupa kata sandi?' })).toHaveAttribute(
    'href',
    '/lupa-kata-sandi'
  );
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
  await expect(page.getByText('Welcome!')).toHaveCount(0);
});

test('admin login redirects to admin attendance', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin_bmis');
  await page.getByLabel('Kata Sandi').fill('admin123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/presensi\/admin$/);
});

test('employee login redirects to employee attendance', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('asep_milo');
  await page.getByLabel('Kata Sandi').fill('pegawai123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/presensi\/user$/);
});

test('short credentials show validation error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('ab');
  await page.getByLabel('Kata Sandi').fill('123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('alert')).toContainText('Username wajib diisi');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/login.spec.ts`  
Expected: FAIL because the page still says `Welcome!`, uses `Password`, and has demo role buttons.

- [ ] **Step 3: Rebuild `Login.vue` layout**

Use this structure:

- Root: `min-h-screen bg-bmis-bg`.
- Left brand panel: `hidden lg:flex lg:w-[34%] flex-col justify-between bg-[#0F172A] px-10 py-12 text-white`, `data-testid="login-brand-panel"`.
- Brand block: `BMIS` wordmark, subtitle `Sistem Manajemen Kehadiran, Shift & Operasional Terpadu`, feature list with check icons.
- Panel footer: `© 2026 Building Management Information System.`
- Right area: `flex flex-1 items-center justify-center px-4`.
- Card: `w-full max-w-[440px] rounded-2xl border border-bmis-border bg-white p-8 shadow-sm`.

Card content:

- Heading `Masuk ke BMIS`, size 24, weight 700, color `text-bmis-text`.
- Subtitle `Masuk dengan kredensial perusahaan`.
- Error banner: `role="alert"`, `bg-bmis-red-light text-bmis-error-text border border-bmis-error`.
- Username input with label `Username`, class `form-input-custom`.
- Password input with label `Kata Sandi`, class `form-input-custom`, eye toggle with `aria-label`.
- Checkbox `Ingat saya`.
- Link `Lupa kata sandi?` to `/lupa-kata-sandi`, color `text-bmis-primary`.
- Submit button `Masuk`, class `btn-bmis btn-bmis-blue w-full`.
- No demo role buttons.

- [ ] **Step 4: Add remember-me behavior**

In `<script setup>`:

```ts
const rememberedUsername = localStorage.getItem('bmis_remembered_username') ?? '';
const username = ref(rememberedUsername);
const password = ref('');
const rememberMe = ref(Boolean(rememberedUsername));
const showPassword = ref(false);
const loadingSubmit = ref(false);
const errorMessage = ref('');
```

On successful login:

```ts
if (rememberMe.value) {
  localStorage.setItem('bmis_remembered_username', uname);
} else {
  localStorage.removeItem('bmis_remembered_username');
}
```

Keep the existing role detection and redirects.

- [ ] **Step 5: Delete the unused duplicate login page**

Run:

```bash
git rm src/pages/auth/Login.vue
```

No route imports that file; build must still pass.

- [ ] **Step 6: Document demo accounts in `README.md`**

Add:

```md
## Akun Demo

- Admin: `admin_bmis` / `admin123`
- Pegawai: `asep_milo` / `pegawai123`
- Saat dev, ganti akun lewat menu profil > `Ganti akun demo`.
```

- [ ] **Step 7: Run login tests and build**

Run: `npm run test:e2e -- tests/e2e/login.spec.ts`  
Expected: PASS, 4 tests.

Run: `npm run build`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/login/Login.vue README.md tests/e2e/login.spec.ts
git commit -m "feat: rebuild login page with reference layout"
```

---

### Task 7: Forgot Password and Link Sent Routes

**Files:**
- Create: `src/pages/login/ForgotPassword.vue`
- Create: `src/pages/login/ResetLinkSent.vue`
- Modify: `src/router/index.ts`
- Modify: `src/App.vue`
- Create: `tests/e2e/auth-routes.spec.ts`

**Interfaces:**
- Consumes: `loginAs` from `tests/e2e/helpers.ts`.
- Produces: routes `/lupa-kata-sandi` and `/tautan-terkirim`, both `meta.public = true`.
- Produces: `ForgotPassword.vue` with heading `Lupa Kata Sandi`, email input, button `Kirim Tautan Reset`, link `Batal`.
- Produces: `ResetLinkSent.vue` with heading `Tautan Terkirim` and button `Kembali ke Login`.

- [ ] **Step 1: Write the failing auth route tests**

Create `tests/e2e/auth-routes.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:e2e -- tests/e2e/auth-routes.spec.ts`  
Expected: FAIL because `/lupa-kata-sandi` redirects to `/login`.

- [ ] **Step 3: Add public routes**

In `src/router/index.ts`, add `meta: { public: true }` to `/login`, and add:

```ts
{
  path: '/lupa-kata-sandi',
  name: 'ForgotPassword',
  component: () => import('../pages/login/ForgotPassword.vue'),
  meta: { public: true },
},
{
  path: '/tautan-terkirim',
  name: 'ResetLinkSent',
  component: () => import('../pages/login/ResetLinkSent.vue'),
  meta: { public: true },
},
```

Extract session and home redirect helpers:

```ts
const readUser = (): { role?: string } => {
  try {
    return JSON.parse(localStorage.getItem('bmis_user') || '{}');
  } catch {
    return {};
  }
};

const homeFor = (u: { role?: string }) =>
  u.role === 'employee' || u.role === 'user' ? '/presensi/user' : '/dashboard';
```

Use them in the `/` redirect and the authenticated branch of `router.beforeEach`.

- [ ] **Step 4: Update the guard**

Replace the path checks with `to.meta.public`:

```ts
const user = readUser();
const isPublic = to.meta.public === true;
if (!isPublic && !isAuthenticated) return next('/login');
if (isPublic && isAuthenticated) return next(homeFor(user));
```

Keep the existing admin guard behavior for `meta.requiresAdmin`.

- [ ] **Step 5: Make `App.vue` use auth-route meta**

```ts
const isAuthPage = computed(() => route.meta.public === true);
```

Use `isAuthPage` for the auth wrapper. Change the wrapper classes from `w-screen h-screen overflow-hidden` to `min-h-screen w-full bg-bmis-bg`. In the main layout branch, change `text-slate-800` to `text-bmis-text`. `/login`, `/lupa-kata-sandi`, and `/tautan-terkirim` must not render `Sidebar` or `Navbar`.

- [ ] **Step 6: Create `ForgotPassword.vue`**

Layout:

- Root: `min-h-screen bg-bmis-bg flex items-center justify-center px-4`.
- Card: `w-full max-w-[520px] rounded-2xl border border-bmis-border bg-white p-8 shadow-sm`.
- Heading `Lupa Kata Sandi`.
- Description `Masukkan email terdaftar. Kami akan mengirim tautan untuk mengatur ulang kata sandi Anda.`
- Label `Email Terdaftar`, input `type="email"`, class `form-input-custom`.
- Submit button `Kirim Tautan Reset`, class `btn-bmis btn-bmis-blue w-full`.
- Link `Batal` to `/login`, muted.
- On submit: validate non-empty email, then `router.push('/tautan-terkirim')`.

- [ ] **Step 7: Create `ResetLinkSent.vue`**

Layout:

- Root: same centered background.
- Card: `w-full max-w-[520px] rounded-2xl border border-bmis-border bg-white p-8 text-center shadow-sm`.
- Green check circle: `bg-bmis-green-light text-bmis-success`.
- Heading `Tautan Terkirim`.
- Description `Kami telah mengirim tautan reset kata sandi ke email terdaftar Anda. Periksa kotak masuk atau folder spam.`
- Button `Kembali ke Login`, class `btn-bmis btn-bmis-blue w-full`, links to `/login`.

- [ ] **Step 8: Run auth tests, all tests, and build**

Run: `npm run test:e2e -- tests/e2e/auth-routes.spec.ts`  
Expected: PASS, 3 tests.

Run: `npm run test:e2e`  
Expected: PASS for all tests.

Run: `npm run build`  
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/pages/login/ForgotPassword.vue src/pages/login/ResetLinkSent.vue src/router/index.ts src/App.vue tests/e2e/auth-routes.spec.ts
git commit -m "feat: add forgot password auth routes"
```

---

### Task 8: Visual Verification and Handoff

**Files:**
- Modify: `.gitignore`
- Create: `tests/e2e/visual.spec.ts`
- Create: `docs/design-alignment/README.md`

**Interfaces:**
- Consumes: `loginAs`.
- Produces: screenshot artifacts in `test-results/design/`.
- Produces: manual review checklist with FigCraft frame IDs.

- [ ] **Step 1: Ignore test artifacts**

Add to `.gitignore`:

```gitignore
test-results
playwright-report
```

- [ ] **Step 2: Create the visual capture test**

Create `tests/e2e/visual.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('reference screens render without horizontal overflow', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: 'test-results/design/login.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);

  await loginAs(page, 'admin');
  await page.goto('/dashboard');
  await page.screenshot({ path: 'test-results/design/admin-dashboard.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);

  await loginAs(page, 'employee');
  await page.goto('/presensi/user');
  await page.screenshot({ path: 'test-results/design/employee-presensi.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});
```

- [ ] **Step 3: Create `docs/design-alignment/README.md`**

Include:

- Reference frames:
  - Admin login: `figcraft://node/4294988869`
  - Login error: `figcraft://node/4294988908`
  - Forgot password: `figcraft://node/4294989020`
  - Link sent: `figcraft://node/4294989032`
  - Admin dashboard shell: `figcraft://node/4294988063`
  - Employee attendance shell: `figcraft://node/197`
- Commands:
  - `npm run test:e2e`
  - `npm run build`
- Manual checklist:
  - Font is Hanken Grotesk.
  - Primary button is `#0058BE`.
  - Sidebar has no logout button.
  - Profile dropdown contains logout.
  - In dev, profile dropdown contains `Ganti akun demo`; in a production build/preview it must not appear.
  - One notification bell.
  - Login page has dark brand panel and white card.
  - Auth pages render without sidebar/navbar.

- [ ] **Step 4: Run full verification**

Run: `npm run test:e2e`  
Expected: PASS for all tests.

Run: `npm run build`  
Expected: PASS.

Inspect the three screenshots in `test-results/design/` against the reference frames.

- [ ] **Step 5: Commit**

```bash
git add .gitignore tests/e2e/visual.spec.ts docs/design-alignment/README.md
git commit -m "docs: add visual verification checklist"
```

---

## Execution Notes

- Plan ini hanya milestone 1: token, shell, auth.
- Dashboard pegawai, halaman settings `5.1a–5.1e`, dan penyelarasan halaman presensi/cuti/roster/lembur masuk plan terpisah.
- Kalau font Hanken Grotesk gagal dimuat, layout harus tetap terbaca dengan fallback Inter.
- Jangan mengubah lokasi logout. Itu keputusan produk yang sudah dikunci.
