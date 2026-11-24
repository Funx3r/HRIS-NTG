<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Users,
  CalendarCheck,
  ChevronDown,
  UserCheck,
  ArrowLeftRight,
  Wallet,
  Layers,
  Award,
  Network
} from 'lucide-vue-next';

const route = useRoute();
const isRosterOpen = ref(true);
const isAttendanceOpen = ref(true);
const isPayrollOpen = ref(true);

const currentRole = ref('admin');

const loadRole = () => {
  try {
    const raw = localStorage.getItem('bmis_user');
    if (raw) {
      const u = JSON.parse(raw);
      currentRole.value = u.role || 'admin';
    }
  } catch {
    currentRole.value = 'admin';
  }
};

loadRole();
watch(() => route.fullPath, () => {
  loadRole();
});

if (typeof window !== 'undefined') {
  window.addEventListener('bmis-role-changed', loadRole);
  window.addEventListener('storage', loadRole);
}

const isSuperAdmin = computed(() => currentRole.value === 'admin');
const isActive = (path: string) => route.path === path;
const isSubActive = (prefix: string) => route.path.startsWith(prefix);

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
</script>

<template>
  <aside class="w-64 bg-white border-r border-bmis-border flex flex-col flex-shrink-0 min-h-screen">
    <!-- Brand Logo (Persis Sidebar.vue BMIS) -->
    <div class="px-6 py-4 border-b border-bmis-border flex items-center justify-center">
      <router-link :to="isSuperAdmin ? '/presensi/admin' : '/presensi/user'" class="flex items-center justify-center">
        <img
          src="/images/logo-bmis.webp"
          alt="Logo BMIS"
          class="h-10 w-auto object-contain"
        />
      </router-link>
    </div>

    <!-- Nav List -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <!-- Dashboard (Khusus Admin) -->
      <router-link
        v-if="isSuperAdmin"
        to="/dashboard"
        :class="navItemClass(isActive('/dashboard'))"
        :aria-current="isActive('/dashboard') ? 'page' : undefined"
      >
        <LayoutDashboard :size="18" />
        <span>Dashboard Utama</span>
      </router-link>

      <!-- Absensi Kehadiran (Admin: Accordion Dropdown) -->
      <div v-if="isSuperAdmin">
        <button
          type="button"
          @click="isAttendanceOpen = !isAttendanceOpen"
          :class="[navItemClass(isSubActive('/presensi')), 'w-full justify-between cursor-pointer']"
          :aria-current="isSubActive('/presensi') ? 'page' : undefined"
          :aria-expanded="isAttendanceOpen"
        >
          <div class="flex items-center gap-3">
            <Clock :size="18" />
            <span>Absensi Kehadiran</span>
          </div>
          <ChevronDown
            :size="16"
            :class="['transition-transform duration-200', isAttendanceOpen ? 'rotate-180' : '']"
          />
        </button>

        <div v-show="isAttendanceOpen" class="pl-9 pr-2 py-1 space-y-1">
          <router-link
            to="/presensi/admin"
            :class="subItemClass(isActive('/presensi/admin'))"
            :aria-current="isActive('/presensi/admin') ? 'page' : undefined"
          >
            <Clock :size="14" />
            <span>Monitoring Kehadiran</span>
          </router-link>
          <router-link
            to="/presensi/user"
            :class="subItemClass(isActive('/presensi/user'))"
            :aria-current="isActive('/presensi/user') ? 'page' : undefined"
          >
            <UserCheck :size="14" />
            <span>Presensi Mandiri</span>
          </router-link>
        </div>
      </div>

      <!-- Absensi Kehadiran (Pegawai: Menu Tunggal Tanpa Dropdown) -->
      <router-link
        v-else
        to="/presensi/user"
        :class="navItemClass(isActive('/presensi/user'))"
        :aria-current="isActive('/presensi/user') ? 'page' : undefined"
      >
        <Clock :size="18" />
        <span>Absensi Kehadiran</span>
      </router-link>

      <!-- Perizinan Cuti (Admin vs Karyawan) -->
      <router-link
        :to="isSuperAdmin ? '/cuti/admin' : '/cuti'"
        :class="navItemClass(isSubActive('/cuti'))"
        :aria-current="isSubActive('/cuti') ? 'page' : undefined"
      >
        <CalendarCheck :size="18" />
        <span>Perizinan Cuti</span>
      </router-link>

      <!-- Jadwal Roster (Admin vs Karyawan) -->
      <div v-if="isSuperAdmin">
        <button
          type="button"
          @click="isRosterOpen = !isRosterOpen"
          :class="[navItemClass(isSubActive('/roster')), 'w-full justify-between cursor-pointer']"
          :aria-current="isSubActive('/roster') ? 'page' : undefined"
          :aria-expanded="isRosterOpen"
        >
          <div class="flex items-center gap-3">
            <CalendarDays :size="18" />
            <span>Jadwal Roster</span>
          </div>
          <ChevronDown
            :size="16"
            :class="['transition-transform duration-200', isRosterOpen ? 'rotate-180' : '']"
          />
        </button>

        <div v-show="isRosterOpen" class="pl-9 pr-2 py-1 space-y-1">
          <!-- Jadwal Kerja -->
          <router-link
            to="/roster/admin"
            :class="subItemClass(isActive('/roster/admin') || isActive('/roster/admin/atur-shift') || isActive('/roster/tambah'))"
            :aria-current="(isActive('/roster/admin') || isActive('/roster/admin/atur-shift') || isActive('/roster/tambah')) ? 'page' : undefined"
          >
            <Users :size="15" />
            <span>Jadwal Kerja</span>
          </router-link>

          <!-- Tukar Shift -->
          <router-link
            to="/roster/admin/tukar-shift"
            :class="subItemClass(isActive('/roster/tukar-shift') || isActive('/roster/admin/tukar-shift'))"
            :aria-current="(isActive('/roster/tukar-shift') || isActive('/roster/admin/tukar-shift')) ? 'page' : undefined"
          >
            <ArrowLeftRight :size="15" />
            <span>Tukar Shift</span>
          </router-link>
        </div>
      </div>

      <!-- Jika Role Pegawai: Hanya Jadwal Roster Saya -->
      <router-link
        v-else
        to="/roster/user"
        :class="navItemClass(isActive('/roster/user'))"
        :aria-current="isActive('/roster/user') ? 'page' : undefined"
      >
        <CalendarDays :size="18" />
        <span>Jadwal Roster</span>
      </router-link>

      <!-- Lembur / SPKL -->
      <router-link
        :to="isSuperAdmin ? '/lembur/admin' : '/lembur/user'"
        :class="navItemClass(isSubActive('/lembur'))"
        :aria-current="isSubActive('/lembur') ? 'page' : undefined"
      >
        <Clock :size="18" />
        <span>Monitor Lembur</span>
      </router-link>

      <!-- Pengaturan Payroll (Admin: Accordion Dropdown) -->
      <div v-if="isSuperAdmin">
        <button
          type="button"
          @click="isPayrollOpen = !isPayrollOpen"
          :class="[navItemClass(isSubActive('/payroll')), 'w-full justify-between cursor-pointer']"
          :aria-current="isSubActive('/payroll') ? 'page' : undefined"
          :aria-expanded="isPayrollOpen"
        >
          <div class="flex items-center gap-3">
            <Wallet :size="18" />
            <span>Pengaturan Payroll</span>
          </div>
          <ChevronDown
            :size="16"
            :class="['transition-transform duration-200', isPayrollOpen ? 'rotate-180' : '']"
          />
        </button>

        <div v-show="isPayrollOpen" class="pl-9 pr-2 py-1 space-y-1">
          <router-link
            to="/payroll/komponen"
            :class="subItemClass(isSubActive('/payroll/komponen'))"
            :aria-current="isSubActive('/payroll/komponen') ? 'page' : undefined"
          >
            <Layers :size="14" />
            <span>Komponen Gaji</span>
          </router-link>
          <router-link
            to="/payroll/grade"
            :class="subItemClass(isSubActive('/payroll/grade'))"
            :aria-current="isSubActive('/payroll/grade') ? 'page' : undefined"
          >
            <Award :size="14" />
            <span>Grade Pegawai</span>
          </router-link>
          <router-link
            to="/payroll/eselon"
            :class="subItemClass(isSubActive('/payroll/eselon'))"
            :aria-current="isSubActive('/payroll/eselon') ? 'page' : undefined"
          >
            <Network :size="14" />
            <span>Eselon / Level Jabatan</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Footer Sidebar -->
    <div class="p-4 border-t border-bmis-border bg-bmis-surface-muted">
      <div class="flex items-center justify-between text-[11px] text-bmis-muted">
        <span>Akses: {{ isSuperAdmin ? 'Admin / HR' : 'Karyawan' }}</span>
        <span class="inline-flex items-center gap-1 text-bmis-success-text font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-bmis-success animate-pulse"></span>
          Aktif
        </span>
      </div>
    </div>
  </aside>
</template>
