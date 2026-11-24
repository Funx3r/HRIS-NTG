# Payroll Data Layer & Master Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun lapisan data async (`Repository<T>` + Composable Stores berbasis `localStorage`) dan mengimplementasikan CRUD nyata beserta 6 halaman form penuh (Tambah & Ubah) untuk Komponen Gaji, Grade Pegawai, dan Eselon Jabatan secara konsisten.

**Architecture:** Lapisan persistensi generic async `createLocalRepository` menyimpan data di `localStorage` dengan fallback seed. Tiga store tipis (`useKomponenGajiStore`, `useGradePegawaiStore`, `useEselonStore`) mengelola state reaktif di memori, validasi, dan soft-delete. Halaman daftar beralih dari dummy `const` ke store reaktif dengan tombol pensil (edit) dan trash (nonaktifkan via `ConfirmDialog`). Enam form halaman penuh dibuat menggunakan shell bersama `PayrollFormShell.vue`, `FormField.vue`, dan `StatusSwitch.vue`. Notifikasi sukses/error ditampilkan via `useToast` dan `ToastViewport.vue`.

**Tech Stack:** Vue 3 Composition API (`<script setup lang="ts">`), Vue Router 4, Tailwind CSS 3.4 (Token BMIS), Lucide Vue Next, Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-11-24-payroll-data-layer-design.md`

## Global Constraints

- Warna primer BMIS: `#0058BE`, hover `#004ba3`, heading `#171C1F`, surface card `bg-white rounded-2xl border border-slate-200 shadow-xs`.
- Tipografi global Hanken Grotesk dengan fallback Inter dan sans-serif; jangan menambah impor font eksternal.
- Breadcrumb dirender in-page melalui `nav[aria-label="Breadcrumb Halaman"]`; topbar `Navbar` tidak disentuh.
- Semua route baru payroll dilindungi `meta: { requiresAdmin: true }`; role `employee` diarahkan ke `/presensi/user`.
- Storage key wajib mengikuti awalan BMIS: `bmis_shared_payroll_komponen_v1`, `bmis_shared_payroll_grade_v1`, `bmis_shared_payroll_eselon_v1`.
- Operasi delete adalah **soft delete** (`status: 'Nonaktif'`); hard delete tidak diekspos di UI.
- Keunikan `kode` dan `urutan` mencakup data berstatus `Nonaktif`.
- Tidak menambah dependensi baru di `package.json`.

## Review Focus

1. **Direct navigation to edit route with non-existent code** (e.g. `/payroll/eselon/KODE_PALSU/ubah`): dialihkan kembali ke daftar `/payroll/eselon` disertai toast error `Data tidak ditemukan.`, tanpa blank page atau form kosong rusak. (Task 6)
2. **Re-activating a soft-deleted item**: saat item `Nonaktif` diedit dan switch status diubah ke `Aktif` lalu disimpan, status baris di tabel dan filter berubah kembali menjadi `Aktif`. (Task 3)
3. **Duplicate code case-insensitivity**: input kode `esel-ii` saat `ESEL-II` sudah ada harus ditolak dengan pesan validasi kode sudah digunakan. (Task 3)
4. **Deactivating already-nonaktif item**: tombol trash pada baris yang sudah `Nonaktif` berada dalam keadaan `disabled` dengan atribut `title="Sudah nonaktif"`. (Task 2)
5. **Form submit with whitespace in code**: input kode dengan spasi di awal/akhir (misal `" ESL-09 "`) otomatis di-trim dan diubah ke huruf besar `"ESL-09"` saat divalidasi dan disimpan. (Task 3)

---

### Task 1: Shared Data Layer & Feedback Infrastructure

**Files:**
- Create: `src/types/payroll.ts`
- Create: `src/data/payrollSeed.ts`
- Create: `src/services/repository.ts`
- Create: `src/services/payrollRepositories.ts`
- Create: `src/composables/useToast.ts`
- Create: `src/components/payroll/ToastViewport.vue`
- Create: `src/components/payroll/ConfirmDialog.vue`
- Create: `src/composables/useKomponenGajiStore.ts`
- Create: `src/composables/useGradePegawaiStore.ts`
- Create: `src/composables/useEselonStore.ts`
- Modify: `src/App.vue:1-33` (pasang ToastViewport)
- Test: `tests/e2e/payroll-data-layer.spec.ts`

**Interfaces:**
- Produces:
  - `Repository<T>`: `{ list(): Promise<T[]>, get(id: string): Promise<T | null>, create(item: T): Promise<T>, update(id: string, patch: Partial<T>): Promise<T> }`
  - `createLocalRepository<T>({ key: string, seed: T[], idOf: (item: T) => string }): Repository<T>`
  - `useToast()`: `{ toasts, showToast(msg: string, type?: 'success'|'error'|'info'), removeToast(id: string) }`
  - `useKomponenGajiStore()`, `useGradePegawaiStore()`, `useEselonStore()`: `{ items, loading, error, load(force?: boolean), create(input), update(kode, patch), deactivate(kode), isKodeTaken(kode, except?), isUrutanTaken?(urutan, except?) }`

- [ ] **Step 1: Write failing test in `tests/e2e/payroll-data-layer.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('data layer loads default seed into localStorage and displays toast', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const loaded = await page.evaluate(async () => {
    const modRep = await import('../../src/services/payrollRepositories');
    const eselon = await modRep.eselonRepository.list();
    const grade = await modRep.gradeRepository.list();
    const komponen = await modRep.komponenRepository.list();

    const modToast = await import('../../src/composables/useToast');
    const { showToast } = modToast.useToast();
    showToast('Infrastruktur data siap', 'success');

    return { eselonCount: eselon.length, gradeCount: grade.length, komponenCount: komponen.length };
  });

  expect(loaded.eselonCount).toBe(5);
  expect(loaded.gradeCount).toBe(5);
  expect(loaded.komponenCount).toBe(5);
  await expect(page.getByText('Infrastruktur data siap')).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/payroll-data-layer.spec.ts`
Expected: FAIL (Cannot resolve modules `src/types/payroll`, `src/services/payrollRepositories`, etc.)

- [ ] **Step 3: Implement data structures, repositories, stores, and feedback components**

1. Buat `src/types/payroll.ts` dengan interface `PayrollStatus`, `KomponenGaji`, `GradePegawai`, `EselonJabatan`.
2. Buat `src/data/payrollSeed.ts` memuat 5 item default untuk komponen, grade, dan eselon (disalin dari halaman eksisting).
3. Buat `src/services/repository.ts` dengan interface `Repository<T>` dan fungsi generic `createLocalRepository<T>`.
4. Buat `src/services/payrollRepositories.ts` mengekspor `komponenRepository`, `gradeRepository`, `eselonRepository`.
5. Buat `src/composables/useToast.ts` dan `src/components/payroll/ToastViewport.vue` (auto-dismiss 4 detik).
6. Pasang `<ToastViewport />` di `src/App.vue`.
7. Buat `src/components/payroll/ConfirmDialog.vue` (`role="alertdialog"`, backdrop, ESC key support).
8. Buat `src/composables/useKomponenGajiStore.ts`, `useGradePegawaiStore.ts`, `useEselonStore.ts` membungkus repository dengan state reaktif `items`, `loading`, `error`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/payroll-data-layer.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/payroll.ts src/data/payrollSeed.ts src/services/ src/composables/ src/components/payroll/ src/App.vue tests/e2e/payroll-data-layer.spec.ts
git commit -m "feat(payroll): add async repository, stores, toast, and confirm dialog"
```

---

### Task 2: List Pages Refactor (Reactive Stores, Actions & Soft Delete)

**Files:**
- Modify: `src/pages/payroll/KomponenGaji.vue:1-336`
- Modify: `src/pages/payroll/GradePegawai.vue:1-323`
- Modify: `src/pages/payroll/EselonJabatan.vue:1-322`
- Test: `tests/e2e/payroll-tables-store.spec.ts`

**Interfaces:**
- Consumes:
  - `useKomponenGajiStore`, `useGradePegawaiStore`, `useEselonStore` dari Task 1
  - `ConfirmDialog.vue` dari Task 1
- Produces:
  - 3 Halaman list membaca data dari store reaktif
  - Kolom aksi berisi 2 tombol: Pensil (navigate edit) dan Trash (buka ConfirmDialog)
  - Trash disabled jika baris sudah `Nonaktif` (Review Focus #4)
  - Kolom STATUS dan Filter Status di ketiga tabel

- [ ] **Step 1: Write failing test in `tests/e2e/payroll-tables-store.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('eselon table soft deletes item and disables trash for nonaktif items', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  const row = page.locator('tr', { hasText: 'NON-ESELON' });
  await expect(row.getByText('Aktif')).toBeVisible();

  // Review Focus #4: Deactivating already-nonaktif item disabled check
  const trashBtn = row.locator('button[aria-label="Nonaktifkan Eselon NON-ESELON"]');
  await trashBtn.click();

  const dialog = page.locator('[role="alertdialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Nonaktifkan Eselon?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Nonaktifkan' }).click();

  await expect(row.getByText('Nonaktif')).toBeVisible();
  await expect(trashBtn).toBeDisabled();
  await expect(trashBtn).toHaveAttribute('title', 'Sudah nonaktif');
});

test('komponen gaji table renders status column and filter', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/komponen');

  await expect(page.locator('th', { hasText: 'STATUS' })).toBeVisible();
  await expect(page.locator('select option', { hasText: 'Semua Status' })).toBeAttached();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/payroll-tables-store.spec.ts`
Expected: FAIL (Button `aria-label="Nonaktifkan..."` not found, th `STATUS` in komponen not found)

- [ ] **Step 3: Update `KomponenGaji.vue`, `GradePegawai.vue`, and `EselonJabatan.vue`**

1. Ganti `const rawItems` dengan import store masing-masing: `useKomponenGajiStore`, `useGradePegawaiStore`, `useEselonStore`.
2. Di `onMounted`, panggil `store.load()`.
3. Ganti ikon `MoreVertical` (3 titik) dengan dua tombol:
   - Pensil: `@click="router.push('/payroll/<entitas>/' + item.kode + '/ubah')"` dengan `aria-label="Ubah <Entitas> " + item.kode`.
   - Trash: `@click="openDeactivateModal(item)"` dengan `aria-label="Nonaktifkan <Entitas> " + item.kode`, disabled jika `item.status === 'Nonaktif'` dan tooltip `title="Sudah nonaktif"`.
4. Tambahkan `ConfirmDialog` di template masing-masing halaman untuk konfirmasi penonaktifan.
5. Tambahkan kolom `STATUS` pada `KomponenGaji.vue` dan tambahkan filter status di toolbar (default `'ALL'`).
6. Update counter badge di header kartu menjadi `store.items.length + ' <Entitas> Terkonfigurasi'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/payroll-tables-store.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/payroll/KomponenGaji.vue src/pages/payroll/GradePegawai.vue src/pages/payroll/EselonJabatan.vue tests/e2e/payroll-tables-store.spec.ts
git commit -m "feat(payroll): wire list tables to reactive stores with pencil and trash actions"
```

---

### Task 3: Shared Form Primitives & Eselon Form (Tambah & Ubah)

**Files:**
- Create: `src/components/payroll/FormField.vue`
- Create: `src/components/payroll/StatusSwitch.vue`
- Create: `src/components/payroll/PayrollFormShell.vue`
- Create: `src/pages/payroll/EselonJabatanForm.vue`
- Modify: `src/router/index.ts:157-164` (daftarkan route tambah dan ubah eselon)
- Modify: `src/components/layout/Sidebar.vue:49-65,255-262` (`isSubActive` check)
- Test: `tests/e2e/payroll-eselon-form.spec.ts`

**Interfaces:**
- Produces:
  - `PayrollFormShell.vue` (shell halaman form penuh seragam)
  - `FormField.vue` (input wrapper dengan label, required mark, hint, error)
  - `StatusSwitch.vue` (switch status toggle)
  - Route `/payroll/eselon/tambah` dan `/payroll/eselon/:kode/ubah`
  - Validasi Eselon: kode unik (maks. 10 char, alfanumerik), urutan unik (integer >= 1), nama wajib, kategori wajib

- [ ] **Step 1: Write failing test in `tests/e2e/payroll-eselon-form.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin can create a new eselon, trim whitespace, and reject duplicate code case-insensitively', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon/tambah');

  await expect(page.getByRole('heading', { name: 'Tambah Eselon' })).toBeVisible();

  // Review Focus #3: Duplicate code case-insensitivity
  await page.getByLabel(/Kode/i).fill('eselon-i');
  await page.getByLabel(/Urutan/i).fill('99');
  await page.getByLabel(/Nama/i).fill('Testing Eselon Duplicate');
  await page.getByRole('button', { name: 'Simpan Eselon' }).click();
  await expect(page.getByText(/Kode sudah digunakan/i)).toBeVisible();

  // Review Focus #5: Whitespace trim & uppercase
  await page.getByLabel(/Kode/i).fill('  esl-new  ');
  await page.getByRole('button', { name: 'Simpan Eselon' }).click();

  await expect(page).toHaveURL(/\/payroll\/eselon$/);
  await expect(page.locator('tr', { hasText: 'ESL-NEW' })).toBeVisible();
});

test('admin can re-activate a nonaktif eselon item via edit form', async ({ page }) => {
  await loginAs(page, 'admin');
  // Review Focus #2: Re-activating a soft-deleted item
  await page.goto('/payroll/eselon/NON-ESELON/ubah');
  await expect(page.getByRole('heading', { name: 'Ubah Eselon' })).toBeVisible();
  await expect(page.getByLabel(/Kode/i)).toBeDisabled();

  // Turn status switch on
  const switchBtn = page.getByRole('switch');
  await switchBtn.click();
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

  await expect(page).toHaveURL(/\/payroll\/eselon$/);
  const row = page.locator('tr', { hasText: 'NON-ESELON' });
  await expect(row.getByText('Aktif')).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/payroll-eselon-form.spec.ts`
Expected: FAIL (Cannot navigate to `/payroll/eselon/tambah`, route not defined)

- [ ] **Step 3: Implement `FormField`, `StatusSwitch`, `PayrollFormShell`, and `EselonJabatanForm`**

1. Buat `src/components/payroll/FormField.vue` menampilkan label, tanda bintang merah jika required, hint text, dan pesan error jika ada.
2. Buat `src/components/payroll/StatusSwitch.vue` memakai `role="switch"` dengan styling aktif/nonaktif token BMIS.
3. Buat `src/components/payroll/PayrollFormShell.vue` menyatukan breadcrumb, judul, subtitle, mode pill (Draft Mode / Mode Edit), card container, callout info, dan sticky bottom action bar (Batal & Simpan).
4. Buat `src/pages/payroll/EselonJabatanForm.vue`:
   - Deteksi mode dari `route.params.kode` (mode ubah jika ada, mode tambah jika tidak ada).
   - Validasi: `kode` (trim, uppercase, regex `^[A-Z0-9_-]+$`, maks 10 karakter, unik via `store.isKodeTaken`), `urutan` (bilangan bulat >= 1, unik via `store.isUrutanTaken`), `nama` (wajib, min 3 karakter), `kategori` (wajib).
   - Saat submit sukses: panggil `store.create` atau `store.update`, picu toast sukses, dan navigasi `router.push('/payroll/eselon')`.
5. Daftarkan routes di `src/router/index.ts`:
   - `/payroll/eselon/tambah` -> `EselonJabatanForm.vue`
   - `/payroll/eselon/:kode/ubah` -> `EselonJabatanForm.vue`
6. Perbarui `Sidebar.vue` agar link Eselon memakai `isSubActive('/payroll/eselon')`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/payroll-eselon-form.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/payroll/ src/pages/payroll/EselonJabatanForm.vue src/router/index.ts src/components/layout/Sidebar.vue tests/e2e/payroll-eselon-form.spec.ts
git commit -m "feat(payroll): implement form shell, status switch, and eselon create/edit form"
```

---

### Task 4: Grade Pegawai Form (Tambah & Ubah)

**Files:**
- Create: `src/pages/payroll/GradePegawaiForm.vue`
- Modify: `src/router/index.ts:151-158` (daftarkan route tambah dan ubah grade)
- Modify: `src/components/layout/Sidebar.vue:246-254` (`isSubActive('/payroll/grade')`)
- Test: `tests/e2e/payroll-grade-form.spec.ts`

**Interfaces:**
- Consumes:
  - `PayrollFormShell.vue`, `FormField.vue`, `StatusSwitch.vue` dari Task 3
  - `useGradePegawaiStore` dari Task 1
- Produces:
  - Halaman `GradePegawaiForm.vue` menangani tambah dan ubah grade
  - Validasi: kode (maks 20, alfanumerik, unik), urutan (integer >= 1, unik), nama (wajib), golongan ASN (opsional)
  - Routes `/payroll/grade/tambah` dan `/payroll/grade/:kode/ubah`

- [ ] **Step 1: Write failing test in `tests/e2e/payroll-grade-form.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin can create and edit grade pegawai', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/grade/tambah');

  await page.getByLabel(/Kode/i).fill('GRADE-6');
  await page.getByLabel(/Urutan/i).fill('6');
  await page.getByLabel(/Nama/i).fill('Ahli Utama');
  await page.getByLabel(/Golongan ASN/i).fill('IV/e');
  await page.getByRole('button', { name: 'Simpan' }).click();

  await expect(page).toHaveURL(/\/payroll\/grade$/);
  await expect(page.locator('tr', { hasText: 'GRADE-6' })).toBeVisible();
  await expect(page.locator('tr', { hasText: 'IV/e' })).toBeVisible();

  // Edit grade
  await page.locator('tr', { hasText: 'GRADE-6' }).locator('button[aria-label="Ubah Grade Pegawai GRADE-6"]').click();
  await expect(page).toHaveURL(/\/payroll\/grade\/GRADE-6\/ubah$/);
  await page.getByLabel(/Nama/i).fill('Ahli Utama Senior');
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

  await expect(page).toHaveURL(/\/payroll\/grade$/);
  await expect(page.locator('tr', { hasText: 'Ahli Utama Senior' })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/payroll-grade-form.spec.ts`
Expected: FAIL (Route `/payroll/grade/tambah` not found)

- [ ] **Step 3: Implement `GradePegawaiForm.vue` and routes**

1. Buat `src/pages/payroll/GradePegawaiForm.vue` menggunakan `PayrollFormShell.vue`:
   - Field: Kode Grade (disabled jika edit), Urutan Grade, Nama Formal Grade, Golongan ASN (opsional, input teks), Status Switcher.
   - Info callout "Kebijakan Struktur Matriks Grade" (sesuai FigCraft `4294990086`).
   - Validasi: `kode` (maks 20, alfanumerik, unik), `urutan` (bilangan bulat >= 1, unik), `nama` (wajib).
2. Daftarkan di `src/router/index.ts`:
   - `/payroll/grade/tambah` -> `GradePegawaiForm.vue`
   - `/payroll/grade/:kode/ubah` -> `GradePegawaiForm.vue`
3. Perbarui `Sidebar.vue` agar link Grade memakai `isSubActive('/payroll/grade')`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/payroll-grade-form.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/payroll/GradePegawaiForm.vue src/router/index.ts src/components/layout/Sidebar.vue tests/e2e/payroll-grade-form.spec.ts
git commit -m "feat(payroll): implement grade pegawai form for create and edit"
```

---

### Task 5: Komponen Gaji Form (Tambah & Ubah)

**Files:**
- Create: `src/pages/payroll/KomponenGajiForm.vue`
- Modify: `src/router/index.ts:145-152` (daftarkan route tambah dan ubah komponen)
- Modify: `src/components/layout/Sidebar.vue:238-246` (`isSubActive('/payroll/komponen')`)
- Test: `tests/e2e/payroll-komponen-form.spec.ts`

**Interfaces:**
- Consumes:
  - `PayrollFormShell.vue`, `FormField.vue`, `StatusSwitch.vue` dari Task 3
  - `useKomponenGajiStore` dari Task 1
- Produces:
  - Halaman `KomponenGajiForm.vue` menangani tambah dan ubah komponen gaji
  - Field: Kode, Nama, Tipe, Sifat, Metode Hitung, Kena Pajak (checkbox/toggle), Status
  - Routes `/payroll/komponen/tambah` dan `/payroll/komponen/:kode/ubah`

- [ ] **Step 1: Write failing test in `tests/e2e/payroll-komponen-form.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin can create and edit komponen gaji with dropdown selections', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/komponen/tambah');

  await page.getByLabel(/Kode/i).fill('TJ_TRANSPORT');
  await page.getByLabel(/Nama/i).fill('Tunjangan Transportasi');
  await page.getByLabel(/Tipe/i).selectOption('Penghasilan');
  await page.getByLabel(/Sifat/i).selectOption('Tetap');
  await page.getByLabel(/Metode Hitung/i).selectOption('Nominal Tetap');
  await page.getByLabel(/Kena Pajak/i).check();
  await page.getByRole('button', { name: 'Simpan Komponen' }).click();

  await expect(page).toHaveURL(/\/payroll\/komponen$/);
  const row = page.locator('tr', { hasText: 'TJ_TRANSPORT' });
  await expect(row).toBeVisible();
  await expect(row.getByText('Tunjangan Transportasi')).toBeVisible();
  await expect(row.getByText('Ya')).toBeVisible();

  // Edit komponen
  await row.locator('button[aria-label="Ubah Komponen Gaji TJ_TRANSPORT"]').click();
  await expect(page).toHaveURL(/\/payroll\/komponen\/TJ_TRANSPORT\/ubah$/);
  await page.getByLabel(/Nama/i).fill('Tunjangan Transport Eksekutif');
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

  await expect(page).toHaveURL(/\/payroll\/komponen$/);
  await expect(page.locator('tr', { hasText: 'Tunjangan Transport Eksekutif' })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/payroll-komponen-form.spec.ts`
Expected: FAIL (Route `/payroll/komponen/tambah` not found)

- [ ] **Step 3: Implement `KomponenGajiForm.vue` and routes**

1. Buat `src/pages/payroll/KomponenGajiForm.vue` menggunakan `PayrollFormShell.vue`:
   - Field: Kode (maks 20, alfanumerik, unik), Nama (wajib), Tipe (Select: Penghasilan, Beban Perusahaan, Potongan), Sifat (Select: Tetap, Sementara), Metode Hitung (Select: Nominal Tetap, Persentase, Per Hari, Input), Kena Pajak (Checkbox / switch PPh 21 TER), Status Switcher.
   - Info callout "Ketentuan Regulasi Komponen Payroll".
2. Daftarkan di `src/router/index.ts`:
   - `/payroll/komponen/tambah` -> `KomponenGajiForm.vue`
   - `/payroll/komponen/:kode/ubah` -> `KomponenGajiForm.vue`
3. Perbarui `Sidebar.vue` agar link Komponen memakai `isSubActive('/payroll/komponen')`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/payroll-komponen-form.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/payroll/KomponenGajiForm.vue src/router/index.ts src/components/layout/Sidebar.vue tests/e2e/payroll-komponen-form.spec.ts
git commit -m "feat(payroll): implement komponen gaji form for create and edit"
```

---

### Task 6: Route Guards, Direct URL Resilience, Full Regression & Old Spec Cleanup

**Files:**
- Modify: `src/pages/payroll/KomponenGajiForm.vue` (404 code redirect)
- Modify: `src/pages/payroll/GradePegawaiForm.vue` (404 code redirect)
- Modify: `src/pages/payroll/EselonJabatanForm.vue` (404 code redirect)
- Modify: `tests/e2e/payroll-eselon.spec.ts:69-79` (ganti test stub modal dengan navigasi form)
- Modify: `tests/e2e/payroll-navigation.spec.ts` (uji active state saat di form)
- Test: `tests/e2e/payroll-resilience.spec.ts`

**Interfaces:**
- Produces:
  - Penanganan route edit dengan kode tidak ada (redirect ke halaman daftar + toast error) (Review Focus #1)
  - Guard role employee untuk semua sub-route form payroll
  - Cleanup dan update suite test eksisting

- [ ] **Step 1: Write failing test in `tests/e2e/payroll-resilience.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('direct navigation to non-existent code redirects to list with error toast', async ({ page }) => {
  await loginAs(page, 'admin');
  // Review Focus #1: Direct navigation to edit route with non-existent code
  await page.goto('/payroll/eselon/KODE_TIDAK_ADA/ubah');

  await expect(page).toHaveURL(/\/payroll\/eselon$/);
  await expect(page.getByText('Data tidak ditemukan.')).toBeVisible();
});

test('employee is redirected when trying to access payroll form routes directly', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/payroll/eselon/tambah');
  await expect(page).toHaveURL(/\/presensi\/user/);

  await page.goto('/payroll/grade/tambah');
  await expect(page).toHaveURL(/\/presensi\/user/);

  await page.goto('/payroll/komponen/tambah');
  await expect(page).toHaveURL(/\/presensi\/user/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/payroll-resilience.spec.ts`
Expected: FAIL (Redirect logic on invalid code not implemented)

- [ ] **Step 3: Implement 404 code redirect & cleanup test suite**

1. Di `KomponenGajiForm.vue`, `GradePegawaiForm.vue`, dan `EselonJabatanForm.vue`:
   - Jika mode ubah dan `store.items` tidak memuat kode terkait, panggil `showToast('Data tidak ditemukan.', 'error')` dan lakukan `router.replace(entityListRoute)`.
2. Di `tests/e2e/payroll-eselon.spec.ts`:
   - Ubah test `tambah eselon opens and closes stub modal` menjadi `tambah eselon navigates to form page and can cancel back to list`.
3. Di `tests/e2e/payroll-navigation.spec.ts`:
   - Tambah assertion bahwa sub-item sidebar tetap memiliki style aktif saat pengguna membuka halaman form (`/payroll/eselon/tambah`).

- [ ] **Step 4: Run full test suite & build check**

Run:
```bash
npx playwright test
npm run build
```
Expected: All tests PASS, build succeeds without TypeScript or bundling errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/payroll/ tests/e2e/
git commit -m "test(payroll): add route resilience tests, guard tests, and cleanup old stub specs"
```