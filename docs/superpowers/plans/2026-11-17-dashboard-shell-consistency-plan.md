# Rencana Implementasi: Dashboard Badge, Breadcrumb Halaman, dan Konsistensi Desain Admin vs Pegawai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghapus badge `LIVE MONITORING` pada dashboard, memindahkan breadcrumb dari topbar ke dalam body halaman dengan fungsi navigasi tautan (`<router-link>`) serta gap rapat konsisten, dan menyelaraskan tipografi judul serta elemen kartu/warna antara halaman Admin dan Pegawai sesuai acuan FigCraft.

**Architecture:** Breadcrumb di Navbar atas dihapus agar header bersih sesuai FigCraft node 165 (`Header Admin`). Setiap halaman memiliki komponen breadcrumb mandiri di dalam body halaman tepat di atas judul H1 (`gap-1` / `mb-1`), dengan tautan induk aktif ke route modul terkait. Standar tipografi judul halaman diseragamkan ke `h1 class="text-2xl font-bold text-[#171C1F] tracking-tight"`, dan elemen kartu serta tombol pada `AdminPresensi.vue` diselaraskan menggunakan token warna BMIS (`#0058BE` / `#0284C7`) menggantikan warna ungu/biru lama `#547fff`.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, Vue Router 4, Tailwind CSS 3.4, Playwright Test.

**Spec:** `docs/superpowers/specs/2026-11-17-hris-visual-alignment-foundation-design.md`

## Global Constraints

- Halaman auth dan logika RBAC localStorage tidak diubah.
- Font utama tetap Hanken Grotesk dengan ukuran judul H1 konsisten 24px (`text-2xl font-bold text-[#171C1F]`).
- Warna primer tombol aksi utama menggunakan token `#0058BE` (hover `#004BA3`), link dan aksen sky `#0284C7`.
- Breadcrumb induk harus berupa `<router-link>` aktif yang berpindah route saat diklik.
- Jarak (gap) antara breadcrumb dan judul halaman harus rapat konsisten (4px – 6px / `mb-1`), tidak boleh terpisah oleh `space-y-4` atau `space-y-6`.
- Semua 18+ tes Playwright e2e harus lolos (PASS) dan `npm run build` harus sukses tanpa error.

## Review Focus

1. **Breadcrumb Topbar Dihapus:** Topbar header tidak boleh lagi menampilkan breadcrumb teks; sisi kiri navbar bersih.
2. **Breadcrumb Body Navigasi Berfungsi:** Mengklik segmen induk breadcrumb (misal `Kehadiran`, `Roster`, `Cuti`, `Lembur`, `Dashboard`) harus benar-benar berpindah ke halaman modul terkait.
3. **Admin Presensi Memiliki Breadcrumb:** Halaman `AdminPresensi.vue` yang sebelumnya kosong breadcrumb harus memiliki breadcrumb `Kehadiran > Monitoring Kehadiran`.
4. **Bug Teks Breadcrumb Cuti Pegawai Diperbaiki:** Halaman `UserCuti.vue` tidak boleh lagi bertuliskan `Roster > Jadwal Roster`, melainkan `Cuti > Manajemen Cuti`.
5. **Warna & Bentuk Admin Presensi Selaras:** Tombol `+ Masuk Manual`, tombol filter, dan kartu filter/KPI tidak boleh lagi memakai ungu `#547fff` atau `border-0`, melainkan token BMIS `#0058BE` dan kartu bergaris tepi `#E2E8F0`.

---

### Task 1: Hapus Badge LIVE MONITORING di Dashboard dan Bersihkan Topbar Navbar

**Files:**
- Modify: `src/pages/dashboard/Dashboard.vue:195-204`
- Modify: `src/components/layout/Navbar.vue:106-112`
- Test: `tests/e2e/shell-navbar.spec.ts`

**Interfaces:**
- Consumes: `Navbar.vue` header component, `Dashboard.vue` header section.
- Produces: Header bar bersih tanpa breadcrumb; dashboard header tanpa badge `LIVE MONITORING`.

- [ ] **Step 1: Update failing test di `tests/e2e/shell-navbar.spec.ts`**

Ubah assertion pada `tests/e2e/shell-navbar.spec.ts` agar memeriksa bahwa topbar header TIDAK lagi memiliki breadcrumb teks, melainkan sisi kiri bersih.

```typescript
// Dalam tests/e2e/shell-navbar.spec.ts
test('navbar uses reference shell and keeps logout in profile menu', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const header = page.locator('header');
  await expect(header.getByText('Mode Admin')).toHaveCount(0);
  await expect(header.getByText('Mode Pegawai')).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Notifikasi' })).toHaveCount(1);

  // Topbar navbar tidak boleh memiliki breadcrumb
  await expect(header.locator('nav[aria-label="Breadcrumb"]')).toHaveCount(0);

  await header.getByRole('button', { name: /Lucia Maria/ }).click();
  const logout = header.getByRole('button', { name: /Keluar \(Logout\)/ });
  await expect(logout).toBeVisible();
  await logout.click();

  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('authenticated'))).toBeNull();
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx playwright test tests/e2e/shell-navbar.spec.ts`
Expected: FAIL karena `nav[aria-label="Breadcrumb"]` masih ada di `Navbar.vue`.

- [ ] **Step 3: Hapus badge `LIVE MONITORING` dari `Dashboard.vue` dan breadcrumb dari `Navbar.vue`**

1. Pada `src/pages/dashboard/Dashboard.vue`, hapus badge span `LIVE MONITORING`:
```vue
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-[#171C1F] tracking-tight">
            Dashboard Operasional
          </h1>
        </div>
```

2. Pada `src/components/layout/Navbar.vue`, hapus blok breadcrumb:
```vue
    <!-- Sisi Kiri Header: Bersih / Mobile Toggle -->
    <div class="flex items-center gap-3">
      <!-- (Breadcrumb dihapus dari navbar sesuai acuan FigCraft node 165) -->
    </div>
```

- [ ] **Step 4: Jalankan test untuk memverifikasi lolos**

Run: `npx playwright test tests/e2e/shell-navbar.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit perubahan Task 1**

```bash
git add src/pages/dashboard/Dashboard.vue src/components/layout/Navbar.vue tests/e2e/shell-navbar.spec.ts
git commit -m "fix: remove live monitoring badge and remove breadcrumb from topbar navbar"
```

---

### Task 2: Implementasi Breadcrumb Halaman Aktif (Clickable Router-Link) dan Normalisasi Gap

**Files:**
- Modify: `src/pages/attendance/AdminPresensi.vue` (tambah breadcrumb dan rapatkan gap)
- Modify: `src/pages/attendance/UserPresensi.vue` (ubah parent jadi router-link)
- Modify: `src/pages/dashboard/Dashboard.vue` (ubah parent jadi router-link)
- Modify: `src/pages/cuti/UserCuti.vue` (perbaiki teks salah Roster -> Cuti dan jadikan router-link)
- Modify: `src/pages/cuti/AdminCuti.vue` (ubah parent jadi router-link)
- Modify: `src/pages/roster/AdminRoster.vue` (pindahkan nav ke dalam header, hilangkan gap 20px)
- Modify: `src/pages/roster/RotasiJadwal.vue` (pindahkan nav ke dalam header, hilangkan gap 24px)
- Modify: `src/pages/roster/AdminTukarShift.vue` (ubah parent jadi router-link)
- Modify: `src/pages/roster/TambahJadwal.vue` (ubah parent jadi router-link dan rapikan gap)
- Modify: `src/pages/roster/UserRoster.vue` (ubah parent jadi router-link)
- Modify: `src/pages/roster/UserTukarShift.vue` (ubah parent jadi router-link)
- Modify: `src/pages/overtime/AdminOvertime.vue` (pindahkan nav ke dalam header, hilangkan gap 20px)
- Modify: `src/pages/overtime/Overtime.vue` (satukan nav ke dalam header, hilangkan gap 24px)
- Test: `tests/e2e/page-breadcrumbs.spec.ts`

**Interfaces:**
- Pola breadcrumb standar yang digunakan di setiap halaman:
```vue
<nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-1" aria-label="Breadcrumb Halaman">
  <router-link to="/[parent-route]" class="hover:text-bmis-primary transition-colors">[Nama Parent]</router-link>
  <span class="text-slate-300">&gt;</span>
  <span class="text-bmis-primary font-semibold">[Nama Halaman Aktif]</span>
</nav>
```

- [ ] **Step 1: Buat failing test `tests/e2e/page-breadcrumbs.spec.ts`**

Tulis test e2e yang memverifikasi bahwa:
1. `AdminPresensi.vue` memiliki breadcrumb dan link `Kehadiran` dapat diklik.
2. `UserCuti.vue` menampilkan teks `Cuti > Manajemen Cuti` (bukan Roster).
3. `RotasiJadwal.vue` memiliki breadcrumb yang mengarah ke `/roster/admin`.

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin attendance page has clickable breadcrumb', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/presensi/admin');

  const main = page.locator('main');
  const breadcrumb = main.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByText('Monitoring Kehadiran')).toBeVisible();

  const parentLink = breadcrumb.getByRole('link', { name: 'Kehadiran' });
  await expect(parentLink).toBeVisible();
});

test('employee cuti page has correct breadcrumb and text', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/cuti');

  const main = page.locator('main');
  const breadcrumb = main.locator('nav[aria-label="Breadcrumb Halaman"]');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb.getByRole('link', { name: 'Cuti' })).toBeVisible();
  await expect(breadcrumb.getByText('Manajemen Cuti')).toBeVisible();
  // Memastikan bug Roster sudah tidak ada di halaman cuti
  await expect(breadcrumb.getByText('Roster')).toHaveCount(0);
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx playwright test tests/e2e/page-breadcrumbs.spec.ts`
Expected: FAIL karena `AdminPresensi` belum punya breadcrumb dan `UserCuti` masih teks Roster.

- [ ] **Step 3: Implementasikan breadcrumb clickable dan rapatkan gap di seluruh 13 file halaman**

1. `AdminPresensi.vue`:
   Tambahkan di dalam kolom header tepat di atas `<h1>`:
   ```vue
   <div>
     <nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-1" aria-label="Breadcrumb Halaman">
       <router-link to="/presensi/admin" class="hover:text-bmis-primary transition-colors">Kehadiran</router-link>
       <span class="text-slate-300">&gt;</span>
       <span class="text-bmis-primary font-semibold">Monitoring Kehadiran</span>
     </nav>
     <h1 class="text-2xl font-bold text-[#171C1F] tracking-tight mb-1">Monitoring Kehadiran</h1>
     <p class="text-slate-500 text-xs mb-0">...</p>
   </div>
   ```

2. `UserCuti.vue`:
   Perbaiki breadcrumb dari Roster menjadi Cuti:
   ```vue
   <nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-1" aria-label="Breadcrumb Halaman">
     <router-link to="/cuti" class="hover:text-bmis-primary transition-colors">Cuti</router-link>
     <span class="text-slate-300">&gt;</span>
     <span class="text-bmis-primary font-semibold">Manajemen Cuti</span>
   </nav>
   ```

3. `RotasiJadwal.vue`, `AdminRoster.vue`, `AdminOvertime.vue`, `Overtime.vue`, `TambahJadwal.vue`:
   Pindahkan tag `<nav>` dari posisi anak root terpisah (yang tadinya terkena margin `space-y-4`/`space-y-6`) ke dalam wrapper `<div>` kolom judul header dengan jarak `mb-1` (4px). Jadikan segmen parent berupa `<router-link>`.

4. `Dashboard.vue`, `UserPresensi.vue`, `AdminCuti.vue`, `UserRoster.vue`, `UserTukarShift.vue`, `AdminTukarShift.vue`:
   Ubah teks parent statis `<span>` menjadi `<router-link>` aktif dengan hover `hover:text-bmis-primary` dan atribut `aria-label="Breadcrumb Halaman"`.

- [ ] **Step 4: Jalankan test untuk memverifikasi lolos**

Run: `npx playwright test tests/e2e/page-breadcrumbs.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit perubahan Task 2**

```bash
git add src/pages/ tests/e2e/page-breadcrumbs.spec.ts
git commit -m "feat: standardize in-page breadcrumbs with active router links and tight header gaps"
```

---

### Task 3: Penyelarasan Desain Admin vs Pegawai (Tipografi Judul, Border Kartu, Warna, dan Form)

**Files:**
- Modify: `src/pages/attendance/AdminPresensi.vue` (ubah judul h1, perbaiki border kartu, ganti #547fff ke token, standarisasi form filter)
- Modify: `src/pages/attendance/UserPresensi.vue` (standarisasi judul h1 ke 24px bold)
- Modify: `src/pages/cuti/UserCuti.vue` (standarisasi judul h1 ke 24px bold)
- Modify: `src/pages/roster/RotasiJadwal.vue` (standarisasi h1 ke font-bold)
- Modify: `src/pages/roster/AdminRoster.vue` (standarisasi h1 ke font-bold)
- Modify: `src/pages/roster/UserRoster.vue` (standarisasi h1 ke font-bold)
- Modify: `src/pages/overtime/AdminOvertime.vue` (standarisasi h1 ke font-bold)
- Modify: `src/pages/overtime/Overtime.vue` (standarisasi h1 ke font-bold)
- Modify: `src/pages/roster/TambahJadwal.vue` (standarisasi h1)
- Test: `tests/e2e/primitives.spec.ts`

**Interfaces:**
- Standar Judul: `<h1 class="text-2xl font-bold text-[#171C1F] tracking-tight">` di setiap halaman.
- Standar Kartu: `bg-white rounded-2xl border border-slate-200 p-5 shadow-xs` (token `.bmis-widget-card`).
- Standar Tombol Utama: `bg-[#0058BE] hover:bg-[#004ba3] text-white text-xs font-bold rounded-lg shadow-xs transition-colors`.

- [ ] **Step 1: Write test case untuk verifikasi standarisasi judul dan kartu di `AdminPresensi`**

Tambahkan pengujian di `tests/e2e/primitives.spec.ts` atau test spesifik untuk memastikan kartu `AdminPresensi` memiliki garis tepi (border) dan tombol utama berwarna token `#0058BE`.

```typescript
test('admin attendance cards and buttons use standard tokens', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/presensi/admin');

  // Judul utama harus h1 font-bold text-[#171C1F]
  const title = page.locator('main h1').first();
  await expect(title).toHaveText('Monitoring Kehadiran');
  await expect(title).toHaveClass(/text-2xl/);
  await expect(title).toHaveClass(/font-bold/);

  // Tombol + Masuk Manual tidak boleh memakai class bg-[#547fff]
  const manualBtn = page.getByRole('button', { name: /Masuk Manual/ });
  await expect(manualBtn).toBeVisible();
  await expect(manualBtn).not.toHaveClass(/bg-\[#547fff\]/);
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx playwright test -g "admin attendance cards and buttons use standard tokens"`
Expected: FAIL karena tombol masih memiliki class `bg-[#547fff]` dan judul masih `h2`.

- [ ] **Step 3: Lakukan penyelarasan tipografi dan styling**

1. Pada `src/pages/attendance/AdminPresensi.vue`:
   - Ganti `<h2 class="text-2xl font-bold text-[#1a3a5c] mb-1">` menjadi `<h1 class="text-2xl font-bold text-[#171C1F] tracking-tight mb-1">`.
   - Ubah kartu filter dari `bg-white rounded-xl shadow-sm p-5 border-0` menjadi `bg-white rounded-2xl border border-slate-200 p-5 shadow-xs`.
   - Ubah kartu statistik dari `bg-white rounded-xl shadow-sm p-5` menjadi `bg-white rounded-2xl border border-slate-200 p-5 shadow-xs`.
   - Ubah kartu tabel riwayat dari `bg-white rounded-xl shadow-sm p-5` menjadi `bg-white rounded-2xl border border-slate-200 p-5 shadow-xs`.
   - Ganti semua warna `#547fff` (ungu/biru lama) dan `#436fe6`:
     - Tombol `+ Masuk Manual`: `bg-[#0058BE] hover:bg-[#004ba3] text-white text-xs font-bold rounded-lg shadow-xs transition-colors`.
     - Tombol `Terapkan Filter`: `bg-[#0058BE] hover:bg-[#004ba3] text-white text-xs font-bold rounded-lg shadow-xs transition-colors`.
     - Link toggle tanggal: `text-[#0284C7] hover:underline font-semibold`.
     - Input & Select form filter: ganti `rounded-[6px]` menjadi `rounded-lg border-slate-200 text-slate-700 focus:outline-none focus:border-[#0058BE] focus:ring-1 focus:ring-[#0058BE]`.
   - Ubah KPI angka `h1 text-[2.2rem]` menjadi `div class="text-[2.2rem] font-bold text-slate-800 m-0 leading-none"` agar tidak merusak semantik struktur H1 dokumen.

2. Pada seluruh file halaman lainnya (`UserPresensi.vue`, `UserCuti.vue`, `RotasiJadwal.vue`, `AdminRoster.vue`, `UserRoster.vue`, `AdminOvertime.vue`, `Overtime.vue`, `TambahJadwal.vue`):
   - Seragamkan judul utama menjadi:
     `<h1 class="text-2xl font-bold text-[#171C1F] tracking-tight">`
     (menghilangkan variasi `font-black`, `text-[#1e293b]`, `text-[#1a3a5c]`, atau `text-xl`).

- [ ] **Step 4: Jalankan test untuk memverifikasi lolos**

Run: `npx playwright test -g "admin attendance cards and buttons use standard tokens"`
Expected: PASS

- [ ] **Step 5: Commit perubahan Task 3**

```bash
git add src/pages/ tests/e2e/primitives.spec.ts
git commit -m "style: align typography, widget card borders, and primary colors between admin and employee"
```

---

### Task 4: Verifikasi Akhir (Seluruh Test Playwright & Production Build)

**Files:**
- Test: `tests/e2e/**/*.spec.ts`

- [ ] **Step 1: Jalankan seluruh suite pengetesan Playwright e2e**

Run: `npm run test:e2e`
Expected: 19+ tests PASS (tidak ada kegagalan sama sekali).

- [ ] **Step 2: Jalankan build produksi Vite**

Run: `npm run build`
Expected: Build berhasil (clean output ke `dist/` tanpa error TypeScript atau CSS).

- [ ] **Step 3: Tangkap screenshot baru untuk verifikasi visual**

Run: `npx playwright test tests/e2e/visual.spec.ts`
Expected: PASS dan hasil tangkapan layar di `test-results/` menunjukkan tampilan breadcrumb rapat, judul seragam, dan kartu bergaris rapi.

- [ ] **Step 4: Commit konfirmasi verifikasi**

```bash
git add docs/ tests/
git commit -m "chore: complete dashboard badge removal, in-page breadcrumbs, and admin-employee visual alignment"
```
