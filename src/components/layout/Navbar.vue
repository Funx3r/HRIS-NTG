<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Bell, ChevronDown, LogOut, ArrowLeftRight } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();

const userName = ref('Lucia Maria');
const userRoleLabel = ref('Building Admin');
const userRole = ref('admin');
const isDropdownOpen = ref(false);
const isNotifOpen = ref(false);
const isDev = import.meta.env.DEV;

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

const syncUser = () => {
  try {
    const raw = localStorage.getItem('bmis_user');
    if (raw) {
      const u = JSON.parse(raw);
      userName.value = u.name || 'Lucia Maria';
      userRoleLabel.value = u.roleLabel || 'Building Admin';
      userRole.value = u.role || 'admin';
    }
  } catch {
    // fallback
  }
  syncNotifs();
};

const onDocClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('[data-notif-root]')) {
    isNotifOpen.value = false;
  }
};

onMounted(() => {
  syncUser();
  document.addEventListener('click', onDocClick, true);
  window.addEventListener('bmis-role-changed', syncUser);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocClick, true);
  window.removeEventListener('bmis-role-changed', syncUser);
});

const switchToAdmin = () => {
  isDropdownOpen.value = false;
  const newU = {
    username: 'admin_bmis',
    name: 'Lucia Maria',
    initials: 'LM',
    role: 'admin',
    roleLabel: 'Building Admin',
    superadmin: 1,
    id: 'usr-admin-1',
    nip: 'ADM.001',
    divisi: 'Manajemen Operasional',
  };
  localStorage.setItem('bmis_user', JSON.stringify(newU));
  syncUser();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bmis-role-changed'));
  }
  if (router.currentRoute.value.path.startsWith('/lembur')) {
    router.push('/lembur/admin');
  } else {
    router.push('/presensi/admin');
  }
};

const switchToEmployee = () => {
  isDropdownOpen.value = false;
  const newU = {
    username: 'asep_milo',
    name: 'Asep Milo',
    initials: 'AM',
    role: 'employee',
    roleLabel: 'Karyawan / Engineering',
    superadmin: 0,
    id: 'usr-employee-asep',
    nip: 'CS.50101',
    divisi: 'Engineering',
  };
  localStorage.setItem('bmis_user', JSON.stringify(newU));
  syncUser();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bmis-role-changed'));
  }
  if (router.currentRoute.value.path.startsWith('/lembur')) {
    router.push('/lembur/user');
  } else {
    router.push('/presensi/user');
  }
};

const switchRole = () => {
  if (userRole.value === 'admin') {
    switchToEmployee();
  } else {
    switchToAdmin();
  }
};

const handleLogout = () => {
  isDropdownOpen.value = false;
  localStorage.removeItem('authenticated');
  localStorage.removeItem('bmis_user');
  router.push('/login');
};
</script>

<template>
  <header class="h-16 bg-white border-b border-bmis-border px-8 flex items-center justify-between flex-shrink-0 relative z-30">
    <!-- Left side of Topbar (clean per FigCraft reference node 165) -->
    <div></div>

    <!-- Right Actions -->
    <div class="flex items-center gap-4">
      <!-- Notification Bell + Dropdown Panel -->
      <div class="relative" data-notif-root>
        <button
          type="button"
          aria-label="Notifikasi"
          @click="toggleNotif"
          class="relative flex h-9 w-9 items-center justify-center rounded-full border border-bmis-border bg-white text-bmis-body hover:bg-bmis-surface-muted cursor-pointer transition-colors"
        >
          <Bell :size="16" />
          <span
            v-if="unreadCount > 0"
            data-testid="notif-badge"
            class="absolute -right-0.5 -top-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-white text-[9px] font-bold flex items-center justify-center leading-none"
          >{{ unreadCount }}</span>
        </button>

        <!-- Notification Panel Dropdown -->
        <div
          v-if="isNotifOpen"
          data-testid="notif-panel"
          class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-bmis-border z-50 overflow-hidden"
          role="dialog"
          aria-label="Panel Notifikasi"
        >
          <!-- Header panel -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-bmis-border bg-white">
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
              :class="['px-4 py-3 flex gap-3 text-xs transition-colors', n.read ? 'bg-white' : 'bg-blue-50/40']"
            >
              <!-- Dot status -->
              <span
                :class="[
                  'mt-1 flex-shrink-0 w-2 h-2 rounded-full',
                  n.type === 'success' ? 'bg-emerald-500' :
                  n.type === 'warning' ? 'bg-amber-500' :
                  n.type === 'error'   ? 'bg-red-500' : 'bg-[#0284C7]'
                ]"
              ></span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-[#171C1F] truncate">{{ n.title }}</p>
                <p class="text-slate-500 mt-0.5 leading-relaxed text-[11px]">{{ n.body }}</p>
                <p class="text-slate-400 mt-1 font-medium text-[10px]">{{ n.time }}</p>
              </div>
            </li>
          </ul>

          <!-- Empty state -->
          <div v-if="notifItems.length === 0" class="px-4 py-6 text-center text-xs text-slate-400">
            Tidak ada notifikasi baru.
          </div>
        </div>
      </div>

      <!-- User Profile Chip with Dropdown (Avatar Biru) -->
      <div class="relative">
        <button
          type="button"
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-3 pl-2 pr-3 py-1 rounded-full border border-bmis-border hover:bg-bmis-surface-muted cursor-pointer transition-colors"
        >
          <div class="w-8 h-8 rounded-full bg-bmis-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {{ userName.split(' ').map(n => n[0]).join('').substring(0, 2) }}
          </div>
          <div class="flex flex-col text-left">
            <span class="text-sm font-semibold text-bmis-text leading-tight">{{ userName }}</span>
            <span class="text-[11px] text-bmis-muted">{{ userRoleLabel }}</span>
          </div>
          <ChevronDown :size="14" class="text-bmis-muted" />
        </button>

        <!-- Profile Menu Dropdown -->
        <div
          v-if="isDropdownOpen"
          class="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-bmis-border py-1.5 z-50 text-xs"
        >
          <div class="px-3.5 py-2 border-b border-bmis-border">
            <span class="text-[11px] text-bmis-muted block font-semibold">Login sebagai</span>
            <span class="font-bold text-bmis-text block text-xs truncate">{{ userName }}</span>
          </div>

          <button
            v-if="isDev"
            type="button"
            @click="switchRole"
            class="w-full text-left px-3.5 py-2.5 text-bmis-body hover:bg-bmis-surface-muted flex items-center gap-2 font-semibold transition-colors"
          >
            <ArrowLeftRight :size="14" class="text-bmis-primary" />
            <span>Ganti akun demo: {{ userRole === 'admin' ? 'Pegawai' : 'Admin' }}</span>
          </button>

          <button
            type="button"
            @click="handleLogout"
            class="w-full text-left px-3.5 py-2.5 text-bmis-error-text hover:bg-bmis-red-light flex items-center gap-2 font-semibold border-t border-bmis-border transition-colors cursor-pointer"
          >
            <LogOut :size="14" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
