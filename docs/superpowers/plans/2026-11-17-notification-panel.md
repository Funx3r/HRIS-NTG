# Notification Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aktifkan tombol Bell di Navbar — klik membuka dropdown panel notifikasi berisi daftar notif dummy yang relevan dengan konteks role (admin vs pegawai), dengan badge jumlah belum-baca, dan tombol "Tandai semua sudah dibaca".

**Architecture:** Panel notifikasi adalah dropdown `<Teleport>`-free yang di-toggle langsung di `Navbar.vue` (sama pola dengan profile dropdown yang sudah ada). Data notifikasi adalah array hardcoded in-component yang dibedakan per role; tidak ada state global / store. Badge merah di icon Bell menunjukkan ada notif belum dibaca, dan hilang setelah "Tandai semua dibaca" diklik.

**Tech Stack:** Vue 3 Composition API, Tailwind CSS (token BMIS), Lucide-vue-next (icons sudah ter-install), Playwright (e2e test).

**Spec:** `docs/superpowers/specs/2026-11-17-hris-visual-alignment-foundation-design.md`

## Global Constraints

- Tailwind utility classes only; tidak boleh ada inline style kecuali warna hex yang belum ada token-nya.
- Warna primer `#0058BE`, accent sky `#0284C7`, error `#DC2626`.
- Font Hanken Grotesk (sudah di-load via CSS).
- Tidak ada dependency NPM baru.
- Frontend-only; tidak ada API call.
- File yang dimodifikasi hanya `Navbar.vue` dan file test-nya.
- Semua teks bahasa Indonesia.

## Review Focus

- Klik di luar panel (backdrop) tidak menutup panel jika user klik tombol lain di navbar — pastikan `closeOnClickOutside` tidak conflict dengan toggle bell button itu sendiri.
- Ketika role berpindah (switchRole), daftar notif harus ikut ganti sesuai role baru — karena `userRole` sudah reaktif, `computed` cukup.
- Badge angka harus hilang (atau berubah ke 0) setelah "Tandai semua dibaca", bukan hanya dot merah yang hilang.
- Panel tidak boleh menutup ketika user klik di dalam panel (scroll list notif dll).
- Tab-key focus dari Bell button ke panel harus dapat diakses (aria-label, role="dialog" atau role="list").

---

### Task 1: Tambah logika notifikasi dan panel dropdown di Navbar.vue

**Files:**
- Modify: `src/components/layout/Navbar.vue`
- Test: `tests/e2e/notification-panel.spec.ts`

**Interfaces:**
- Produces: reactive `isNotifOpen: Ref<boolean>`, `unreadCount: ComputedRef<number>`, `notifList: ComputedRef<NotifItem[]>`, `markAllRead(): void`
- `NotifItem = { id: string; title: string; body: string; time: string; read: boolean; icon: 'check' | 'clock' | 'alert' | 'info' }`

- [ ] **Step 1: Tulis failing test**

```ts
// tests/e2e/notification-panel.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('bell button opens notification panel', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  const bell = page.getByRole('button', { name: 'Notifikasi' });
  await expect(bell).toBeVisible();

  // Panel belum ada
  await expect(page.locator('[data-testid="notif-panel"]')).toHaveCount(0);

  await bell.click();
  await expect(page.locator('[data-testid="notif-panel"]')).toBeVisible();
});

test('notification panel shows role-specific items', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Notifikasi' }).click();

  const panel = page.locator('[data-testid="notif-panel"]');
  await expect(panel.getByText('Admin')).toBeVisible(); // heading atau notif admin
  await expect(panel.locator('[data-testid="notif-item"]')).toHaveCount({ minimum: 1 });
});

test('mark all read clears badge count', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  // Badge hitung awal ada
  const badge = page.locator('[data-testid="notif-badge"]');
  await expect(badge).toBeVisible();

  await page.getByRole('button', { name: 'Notifikasi' }).click();
  await page.getByRole('button', { name: 'Tandai semua dibaca' }).click();

  await expect(badge).toHaveCount(0);
});

test('clicking outside panel closes it', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Notifikasi' }).click();
  await expect(page.locator('[data-testid="notif-panel"]')).toBeVisible();

  // Klik di luar panel
  await page.locator('main').click({ position: { x: 100, y: 300 } });
  await expect(page.locator('[data-testid="notif-panel"]')).toHaveCount(0);
});

test('employee sees different notifications', async ({ page }) => {
  await loginAs(page, 'employee');
  await page.goto('/presensi/user');
  await page.getByRole('button', { name: 'Notifikasi' }).click();

  const panel = page.locator('[data-testid="notif-panel"]');
  await expect(panel.locator('[data-testid="notif-item"]')).toHaveCount({ minimum: 1 });
});
```

- [ ] **Step 2: Jalankan test — pastikan FAIL**

```
npx playwright test tests/e2e/notification-panel.spec.ts
```
Expected: semua FAIL karena `[data-testid="notif-panel"]` tidak ada.

- [ ] **Step 3: Tambah state dan data notifikasi ke `<script setup>` Navbar.vue**

Tambahkan setelah `const isDev = ...`:

```ts
// --- Notification Panel ---
const isNotifOpen = ref(false);

interface NotifItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'success' | 'warning' | 'info' | 'error';
}

const adminNotifs: NotifItem[] = [
  { id: 'n1', title: 'Presensi Manual Tersimpan', body: 'Input presensi manual untuk Budi Santoso (CS.50102) berhasil disimpan.', time: '5 menit lalu', read: false, type: 'success' },
  { id: 'n2', title: 'Lembur Menunggu Persetujuan', body: '3 pengajuan lembur baru memerlukan otorisasi SPKL dari Anda.', time: '1 jam lalu', read: false, type: 'warning' },
  { id: 'n3', title: 'Jadwal Roster Diaktifkan', body: 'Jadwal Shift Engineering minggu ini berhasil diaktifkan dan dikirim ke pegawai.', time: '2 jam lalu', read: false, type: 'info' },
  { id: 'n4', title: 'Laporan Ekspor Siap', body: 'Laporan rekapitulasi kehadiran Oktober 2026 telah selesai diproses.', time: 'Kemarin', read: true, type: 'info' },
];

const employeeNotifs: NotifItem[] = [
  { id: 'e1', title: 'Cuti Disetujui', body: 'Permohonan cuti tahunan Anda pada 20–21 Nov 2026 telah disetujui oleh supervisor.', time: '10 menit lalu', read: false, type: 'success' },
  { id: 'e2', title: 'Pengingat Presensi', body: 'Jangan lupa lakukan check-in hari ini sebelum pukul 08.00 WIB.', time: '30 menit lalu', read: false, type: 'warning' },
  { id: 'e3', title: 'Tukar Shift Disetujui', body: 'Permintaan tukar shift dengan Reza (CS.50105) untuk Rabu 19 Nov telah disetujui.', time: '3 jam lalu', read: true, type: 'success' },
];

const notifItems = ref<NotifItem[]>([...adminNotifs]);

// Sinkron daftar notif saat role berubah
const syncNotifs = () => {
  const raw = localStorage.getItem('bmis_user');
  const role = raw ? JSON.parse(raw).role : 'admin';
  notifItems.value = role === 'employee' || role === 'user'
    ? [...employeeNotifs]
    : [...adminNotifs];
};

const unreadCount = computed(() => notifItems.value.filter(n => !n.read).length);

const markAllRead = () => {
  notifItems.value = notifItems.value.map(n => ({ ...n, read: true }));
};

const toggleNotif = () => {
  isNotifOpen.value = !isNotifOpen.value;
  if (isDropdownOpen.value) isDropdownOpen.value = false;
};

const closeNotif = () => { isNotifOpen.value = false; };
```

Juga panggil `syncNotifs()` di dalam `syncUser()` (setelah assign nilai userName dll), dan tambahkan listener `bmis-role-changed` di `onMounted` agar notif ikut ganti saat demo switcher dipakai.

- [ ] **Step 4: Tambah template panel notifikasi di `<template>` Navbar.vue**

Ganti blok `<!-- Notification -->` yang ada:

```html
<!-- Notification Bell + Panel -->
<div class="relative">
  <button
    type="button"
    aria-label="Notifikasi"
    @click="toggleNotif"
    class="relative flex h-9 w-9 items-center justify-center rounded-full border border-bmis-border bg-white text-bmis-body hover:bg-bmis-surface-muted"
  >
    <Bell :size="16" />
    <span
      v-if="unreadCount > 0"
      data-testid="notif-badge"
      class="absolute -right-0.5 -top-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-white text-[9px] font-bold flex items-center justify-center leading-none"
    >{{ unreadCount }}</span>
  </button>

  <!-- Panel Notifikasi -->
  <div
    v-if="isNotifOpen"
    data-testid="notif-panel"
    class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-bmis-border z-50 overflow-hidden"
    role="dialog"
    aria-label="Panel Notifikasi"
  >
    <!-- Header panel -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-bmis-border">
      <span class="font-bold text-sm text-[#171C1F]">Notifikasi</span>
      <button
        v-if="unreadCount > 0"
        type="button"
        @click="markAllRead"
        class="text-[11px] text-[#0284C7] hover:underline font-semibold cursor-pointer"
      >
        Tandai semua dibaca
      </button>
    </div>

    <!-- Daftar notif -->
    <ul class="max-h-72 overflow-y-auto divide-y divide-slate-100">
      <li
        v-for="n in notifItems"
        :key="n.id"
        data-testid="notif-item"
        :class="['px-4 py-3 flex gap-3 text-xs transition-colors', n.read ? 'bg-white' : 'bg-blue-50/50']"
      >
        <!-- Dot warna type -->
        <span :class="[
          'mt-0.5 flex-shrink-0 w-2 h-2 rounded-full',
          n.type === 'success' ? 'bg-emerald-500' :
          n.type === 'warning' ? 'bg-amber-500' :
          n.type === 'error'   ? 'bg-red-500' : 'bg-[#0284C7]'
        ]"></span>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-[#171C1F] truncate">{{ n.title }}</p>
          <p class="text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{{ n.body }}</p>
          <p class="text-slate-400 mt-1 font-medium">{{ n.time }}</p>
        </div>
      </li>
    </ul>

    <!-- Footer kosong state -->
    <div v-if="notifItems.length === 0" class="px-4 py-6 text-center text-xs text-slate-400">
      Tidak ada notifikasi.
    </div>
  </div>
</div>
```

- [ ] **Step 5: Tambah click-outside untuk menutup panel**

Di `onMounted`, tambahkan listener global (pola sama dengan profile dropdown jika ada, atau buat baru):

```ts
const onDocClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('[data-notif-root]')) {
    isNotifOpen.value = false;
  }
};
document.addEventListener('click', onDocClick, true);
onUnmounted(() => document.removeEventListener('click', onDocClick, true));
```

Tambahkan `data-notif-root` attribute di wrapper `<div class="relative">` Bell.
Import `onUnmounted` dari `'vue'`.

- [ ] **Step 6: Jalankan test — pastikan PASS**

```
npx playwright test tests/e2e/notification-panel.spec.ts
```
Expected: 5 PASS 0 FAIL.

- [ ] **Step 7: Jalankan full e2e suite + production build**

```
npx playwright test
npm run build
```
Expected: semua test lama tetap PASS, build sukses.

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/Navbar.vue tests/e2e/notification-panel.spec.ts
git commit -m "feat: add notification bell dropdown panel with role-aware dummy data"
```
