# Halaman Eselon / Level Jabatan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan halaman **Eselon / Level Jabatan** (langkah 3 setup Payroll) di `/payroll/eselon` beserta entri sub-menu di accordion `Pengaturan Payroll`, memakai pola tabel + filter + modal stub yang sudah dipakai `KomponenGaji.vue` dan `GradePegawai.vue`.

**Architecture:** Satu komponen baru `src/pages/payroll/EselonJabatan.vue` dengan state lokal (`searchQuery`, `kategoriFilter`, `currentPage`) dan 5 baris dummy. Sidebar mendapat satu `router-link` tambahan di blok payroll; router mendapat satu route `requiresAdmin`. Tidak ada store global, API, atau form nyata — modal tambah tetap stub.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vue Router 4, Tailwind 3.4 (token BMIS), Lucide Vue Next, Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-11-17-hris-visual-alignment-foundation-design.md` (token & shell) + FigCraft `Eselon / Level Jabatan` (`4294990458`), `Form Tambah Eselon` (`4294990751`), `Form Ubah Eselon` (`4294991014`).

## Global Constraints

- Tanpa hex liar kecuali badge sudah dipakai halaman payroll lain: primary `#0058BE`, hover `#004ba3`, heading `#171C1F`.
- Font global Hanken Grotesk; jangan menambah import font.
- Topbar tidak disentuh; breadcrumb dirender di dalam halaman (`nav[aria-label="Breadcrumb Halaman"]`).
- Sub-menu Payroll hanya untuk `isSuperAdmin`; employee tidak melihat dan tidak bisa membuka route.
- Modal tambah = stub ("Form sedang dalam pengembangan"), bukan form nyata.
- Frontend-only, dummy data di dalam komponen, `perPage = 10`.

## Review Focus

- **Role guard:** employee yang membuka `/payroll/eselon` langsung harus mendarat di `/presensi/user` dan tidak melihat sub-menu Eselon. (Task 1)
- **Active state:** saat di `/payroll/eselon`, sub-menu Eselon berwarna `rgb(0, 88, 190)` dan accordion tetap terbuka. (Task 1)
- **Kombinasi filter:** memilih kategori lalu mengetik pencarian harus menyaring dengan logika AND, bukan saling menimpa. (Task 2)
- **Hasil kosong:** pencarian tanpa hasil menampilkan pesan kosong dan counter `Menampilkan 0 dari 0 entri`, bukan tabel kosong tanpa keterangan. (Task 2)
- **Lebar sidebar:** item payroll ketiga tidak boleh membuat `nav` sidebar horizontal-scroll pada 1280×800. (Task 1)

---

### Task 1: Route, Sidebar, dan Stub Halaman Eselon

**Files:**
- Modify: `src/router/index.ts` (blok `// Modul Payroll`, setelah route `/payroll/grade`)
- Modify: `src/components/layout/Sidebar.vue:4-13` (import ikon), `:236-253` (blok sub-menu payroll)
- Create: `src/pages/payroll/EselonJabatan.vue` (stub)
- Test: `tests/e2e/payroll-navigation.spec.ts` (tambah 3 test)

**Interfaces:**
- Consumes: `isSuperAdmin`, `isActive`, `isSubActive`, `subItemClass` dari `Sidebar.vue`; guard `meta.requiresAdmin` yang sudah ada di `router.beforeEach`.
- Produces: route `{ path: '/payroll/eselon', name: 'EselonJabatan', meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Eselon / Level Jabatan' } }`; sub-link label `Eselon / Level Jabatan` ke `/payroll/eselon`.

- [x] **Step 1: Tambah 3 test yang gagal ke `tests/e2e/payroll-navigation.spec.ts`**

```ts
test('admin can navigate to Eselon and see active style', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await expect(page).toHaveURL(/\/payroll\/eselon/);
  const activeLink = page.locator('aside').getByRole('link', { name: 'Eselon / Level Jabatan' });
  await expect(activeLink).toHaveCSS('color', 'rgb(0, 88, 190)');
  await expect(page.locator('aside').getByRole('button', { name: 'Pengaturan Payroll' }))
    .toHaveAttribute('aria-expanded', 'true');
});

test('employee cannot access Eselon route', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/payroll/eselon');

  await expect(page).toHaveURL(/\/presensi\/user/);
  await expect(page.locator('aside').getByText('Eselon / Level Jabatan')).toHaveCount(0);
});

test('payroll sub-menu keeps sidebar within viewport width', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  const nav = page.locator('aside nav');
  const overflows = await nav.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflows).toBe(false);
});
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `npx playwright test tests/e2e/payroll-navigation.spec.ts`
Expected: FAIL — `Eselon / Level Jabatan` tidak ditemukan; test employee gagal karena `/payroll/eselon` belum ada.

- [x] **Step 3: Tambah route di `src/router/index.ts`**

Sisipkan setelah route `/payroll/grade`:

```ts
  {
    path: '/payroll/eselon',
    name: 'EselonJabatan',
    component: () => import('../pages/payroll/EselonJabatan.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Eselon / Level Jabatan' },
  },
```

- [x] **Step 4: Buat stub `src/pages/payroll/EselonJabatan.vue`**

```vue
<template>
  <div class="p-6">
    <h1 class="text-xl font-bold">Eselon / Level Jabatan</h1>
  </div>
</template>
```

- [x] **Step 5: Tambah ikon dan sub-link di `src/components/layout/Sidebar.vue`**

Tambah `Network` ke import `lucide-vue-next` (satu blok dengan `Wallet, Layers, Award`). Sisipkan setelah `router-link` Grade Pegawai:

```vue
          <router-link
            to="/payroll/eselon"
            :class="subItemClass(isActive('/payroll/eselon'))"
            :aria-current="isActive('/payroll/eselon') ? 'page' : undefined"
          >
            <Network :size="14" />
            <span>Eselon / Level Jabatan</span>
          </router-link>
```

- [x] **Step 6: Jalankan, pastikan lolos**

Run: `npx playwright test tests/e2e/payroll-navigation.spec.ts`
Expected: PASS (7 tests).

- [x] **Step 7: Commit**

```bash
git add src/router/index.ts src/components/layout/Sidebar.vue src/pages/payroll/EselonJabatan.vue tests/e2e/payroll-navigation.spec.ts
git commit -m "feat(payroll): add Eselon route and sidebar entry"
```

---

### Task 2: Halaman Eselon / Level Jabatan

**Files:**
- Modify: `src/pages/payroll/EselonJabatan.vue` (ganti stub)
- Test: `tests/e2e/payroll-eselon.spec.ts`

**Interfaces:**
- Consumes: route `/payroll/eselon`, kelas token BMIS, pola header/toolbar/pagination dari `GradePegawai.vue`.
- Produces: H1 `Eselon / Level Jabatan`; badge langkah `LANGKAH 3 DARI 16 • SETUP MASTER GAJI`; card `Daftar Eselon / Level Jabatan` + `5 Level Terkonfigurasi`; search placeholder `Cari kode atau nama level jabatan...`; filter `Semua Kategori | Struktural | Fungsional | Non-Eselon`; tabel 6 kolom; modal stub `Form Tambah Eselon`.

- [x] **Step 1: Tulis test gagal `tests/e2e/payroll-eselon.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('eselon page renders layout, breadcrumb, and five rows', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  const breadcrumb = page.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByText('Payroll')).toBeVisible();
  await expect(breadcrumb.getByText('Eselon / Level Jabatan')).toBeVisible();

  await expect(page.getByText('LANGKAH 3 DARI 16 • SETUP MASTER GAJI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Eselon / Level Jabatan', level: 1 })).toBeVisible();
  await expect(page.getByText('Level pekerjaan pegawai dan acuan hierarki jabatan.')).toBeVisible();

  await expect(page.getByText('Daftar Eselon / Level Jabatan')).toBeVisible();
  await expect(page.getByText('5 Level Terkonfigurasi')).toBeVisible();
  await expect(page.getByText('Menampilkan 5 dari 5 entri')).toBeVisible();

  const table = page.locator('table');
  for (const kode of ['ESELON-I', 'ESELON-II', 'ESELON-III', 'FUNG-AHLI', 'NON-ESELON']) {
    await expect(table.getByRole('cell', { name: kode, exact: true })).toBeVisible();
  }
  await expect(table.getByText('Direktur Utama / Pimpinan Tinggi')).toBeVisible();
  await expect(table.getByText('Tenaga Ahli Utama')).toBeVisible();
  await expect(table.getByText('Non-Eselon', { exact: true })).toBeVisible();
});

test('search filter matches kode or nama and resets counter', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await page.getByPlaceholder('Cari kode atau nama level jabatan...').fill('divisi');

  const table = page.locator('table');
  await expect(table.getByRole('cell', { name: 'ESELON-II', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'ESELON-I', exact: true })).toHaveCount(0);
  await expect(page.getByText('Menampilkan 1 dari 1 entri')).toBeVisible();
});

test('kategori filter combines with search using AND', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await page.getByPlaceholder('Cari kode atau nama level jabatan...').fill('utama');
  await page.getByRole('combobox').selectOption('Fungsional');

  const table = page.locator('table');
  await expect(table.getByRole('cell', { name: 'FUNG-AHLI', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'ESELON-I', exact: true })).toHaveCount(0);
  await expect(page.getByText('Menampilkan 1 dari 1 entri')).toBeVisible();

  await page.getByRole('combobox').selectOption('Struktural');
  await expect(table.getByRole('row')).toHaveCount(1); // header only
  await expect(page.getByText('Tidak ada data eselon yang sesuai dengan filter.')).toBeVisible();
});

test('empty result shows zero counter', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await page.getByPlaceholder('Cari kode atau nama level jabatan...').fill('zzz');

  await expect(page.getByText('Menampilkan 0 dari 0 entri')).toBeVisible();
  await expect(page.getByText('Tidak ada data eselon yang sesuai dengan filter.')).toBeVisible();
});

test('tambah eselon opens and closes stub modal', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/payroll/eselon');

  await page.getByRole('button', { name: 'Tambah Eselon' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Form Tambah Eselon')).toBeVisible();

  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `npx playwright test tests/e2e/payroll-eselon.spec.ts`
Expected: FAIL — halaman masih stub.

- [x] **Step 3: Implementasi `src/pages/payroll/EselonJabatan.vue`**

`<script setup lang="ts">`:
- Interface `EselonItem { kode: string; nama: string; urutan: number; kategori: 'Struktural' | 'Fungsional' | 'Non-Eselon'; status: 'Aktif' | 'Nonaktif' }`.
- Data (urutan sesuai FigCraft):

| kode | nama | urutan | kategori | status |
|---|---|---|---|---|
| ESELON-I | Direktur Utama / Pimpinan Tinggi | 1 | Struktural | Aktif |
| ESELON-II | Kepala Divisi / Senior VP | 2 | Struktural | Aktif |
| ESELON-III | Kepala Bagian / Manajer | 3 | Struktural | Aktif |
| FUNG-AHLI | Tenaga Ahli Utama | 4 | Fungsional | Aktif |
| NON-ESELON | Staf Operasional Lapangan | 5 | Non-Eselon | Aktif |

- State: `searchQuery = ref('')`, `kategoriFilter = ref<'ALL' | 'Struktural' | 'Fungsional' | 'Non-Eselon'>('ALL')`, `currentPage = ref(1)`, `perPage = 10`, `isModalOpen = ref(false)`.
- `filteredList` = AND antara pencarian `kode`/`nama` (case-insensitive, trim) dan kategori; `totalPages`; `paginatedList`; `watch([searchQuery, kategoriFilter], () => { currentPage.value = 1; })`.
- Ikon: `Network`, `PlusCircle`, `Search`, `ChevronLeft`, `ChevronRight`, `MoreVertical`, `X`.

`<template>` (struktur identik `GradePegawai.vue`, tanpa tombol Ekspor):
- Breadcrumb `Payroll` (link ke `/payroll/komponen`) `>` `Eselon / Level Jabatan`.
- Badge langkah + H1 + subtitle persis seperti assertion test.
- Tombol kanan: `Tambah Eselon` (`bg-[#0058BE] hover:bg-[#004ba3]`).
- Card header: ikon `Network` dalam kotak `w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#0058BE]`; judul `Daftar Eselon / Level Jabatan`; pill `5 Level Terkonfigurasi` (`bg-blue-50 text-blue-700 border-blue-200`); sub-teks `Acuan urutan jabatan untuk pemetaan tunjangan.`
- Toolbar: input search (placeholder persis), `select v-model="kategoriFilter"` dengan opsi `ALL/Semua Kategori`, `Struktural`, `Fungsional`, `Non-Eselon`, dan counter `Menampilkan {{ paginatedList.length }} dari {{ filteredList.length }} entri`.
- Tabel: `thead` KODE, NAMA, URUTAN, KATEGORI, STATUS, AKSI; urutan pakai badge kotak `w-6 h-6 rounded-md bg-slate-100`; badge kategori — Struktural `bg-blue-50 text-[#0058BE] border-blue-200`, Fungsional `bg-emerald-50 text-emerald-700 border-emerald-200`, Non-Eselon `bg-slate-100 text-slate-600 border-slate-200`; status memakai pola badge mint `Aktif` dari `GradePegawai.vue`; kolom aksi tombol ikon `MoreVertical`.
- Baris kosong `colspan="6"` dengan teks persis assertion.
- Footer pagination: `Halaman {{ currentPage }} dari {{ totalPages }}`, tombol `Sebelumnya`/`Selanjutnya` dengan `disabled`.
- Modal stub: `role="dialog" aria-modal="true"`, judul `Form Tambah Eselon`, tombol X ber-`aria-label="Close"`, deskripsi menyebut field Kode, Urutan, Nama, Kategori, Status Aktif, tombol `Tutup`.

- [x] **Step 4: Jalankan, pastikan lolos**

Run: `npx playwright test tests/e2e/payroll-eselon.spec.ts`
Expected: PASS (5 tests).

- [x] **Step 5: Commit**

```bash
git add src/pages/payroll/EselonJabatan.vue tests/e2e/payroll-eselon.spec.ts
git commit -m "feat(payroll): implement Eselon / Level Jabatan page"
```

---

### Task 3: Regresi Penuh dan Build

**Files:** tidak ada file baru.

**Interfaces:**
- Consumes: seluruh test payroll + suite lama.

- [x] **Step 1: Jalankan seluruh suite**

Run: `npx playwright test`
Expected: PASS, 0 FAIL (37 test lama + 8 test baru).

- [x] **Step 2: Build produksi**

Run: `npm run build`
Expected: sukses, chunk `EselonJabatan-*.js` muncul di output.

- [x] **Step 3: Tandai plan selesai dan commit**

Centang step 1–2, lalu:

```bash
git add docs/superpowers/plans/2026-11-24-payroll-eselon-page.md
git commit -m "docs(payroll): mark Eselon plan complete"
```

---

## Handoff

Tiga task, semuanya menumpang pola yang sudah ada; tidak ada perubahan skema data atau komponen bersama. Untuk plan ini saya merekomendasikan **Native** (eksekusi langsung di sesi ini), karena task 1 dan 2 saling menempel pada dua file yang sama dan biayanya lebih murah daripada dua reviewer terpisah.
