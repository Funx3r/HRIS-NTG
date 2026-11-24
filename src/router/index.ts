import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const readUser = (): { role?: string } => {
  try {
    return JSON.parse(localStorage.getItem('bmis_user') || '{}');
  } catch {
    return {};
  }
};

const homeFor = (u: { role?: string }) =>
  u.role === 'employee' || u.role === 'user' ? '/presensi/user' : '/dashboard';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/login/Login.vue'),
    meta: { public: true },
  },
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
  {
    path: '/',
    redirect: () => {
      if (localStorage.getItem('authenticated') !== 'true') return '/login';
      return homeFor(readUser());
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/dashboard/Dashboard.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Dashboard', breadcrumb: 'Monitoring Operasional' },
  },
  // Modul Presensi
  {
    path: '/presensi/user',
    name: 'UserPresensi',
    component: () => import('../pages/attendance/UserPresensi.vue'),
    meta: { breadcrumbParent: 'Kehadiran', breadcrumb: 'Presensi Mandiri' },
  },
  {
    path: '/presensi/admin',
    name: 'AdminPresensi',
    component: () => import('../pages/attendance/AdminPresensi.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Kehadiran', breadcrumb: 'Monitoring Kehadiran' },
  },
  // Modul Roster
  {
    path: '/roster/admin',
    name: 'RotasiJadwal',
    component: () => import('../pages/roster/RotasiJadwal.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Roster', breadcrumb: 'Jadwal Kerja' },
  },
  {
    path: '/roster/admin/atur-shift',
    name: 'AdminRoster',
    component: () => import('../pages/roster/AdminRoster.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Roster', breadcrumb: 'Atur Shift' },
  },
  {
    path: '/roster/tim',
    redirect: '/roster/admin',
  },
  {
    path: '/roster/tambah',
    name: 'TambahJadwal',
    component: () => import('../pages/roster/TambahJadwal.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Roster', breadcrumb: 'Tambah Jadwal' },
  },
  {
    path: '/roster/tukar-shift',
    name: 'AdminTukarShift',
    component: () => import('../pages/roster/AdminTukarShift.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Roster', breadcrumb: 'Tukar Shift' },
  },
  {
    path: '/roster/admin/tukar-shift',
    redirect: '/roster/tukar-shift',
  },
  {
    path: '/roster/user/tukar-shift',
    redirect: '/roster/user',
  },
  {
    path: '/roster/user',
    name: 'UserRoster',
    component: () => import('../pages/roster/UserRoster.vue'),
    meta: { breadcrumbParent: 'Roster', breadcrumb: 'Jadwal Roster' },
  },
  // Modul Cuti
  {
    path: '/cuti',
    name: 'UserCuti',
    component: () => import('../pages/cuti/UserCuti.vue'),
    meta: { breadcrumbParent: 'Cuti', breadcrumb: 'Manajemen Cuti' },
  },
  {
    path: '/cuti/admin',
    name: 'AdminCuti',
    component: () => import('../pages/cuti/AdminCuti.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Cuti', breadcrumb: 'Manajemen Cuti' },
  },
  // Modul Lembur
  {
    path: '/lembur',
    redirect: () => {
      try {
        const u = JSON.parse(localStorage.getItem('bmis_user') || '{}');
        return u.role === 'employee' || u.role === 'user' ? '/lembur/user' : '/lembur/admin';
      } catch {
        return '/lembur/admin';
      }
    },
  },
  {
    path: '/lembur/admin',
    name: 'AdminOvertime',
    component: () => import('../pages/overtime/AdminOvertime.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Lembur', breadcrumb: 'Rekap & Otorisasi Lembur' },
  },
  {
    path: '/lembur/user',
    name: 'UserOvertime',
    component: () => import('../pages/overtime/Overtime.vue'),
    meta: { breadcrumbParent: 'Lembur', breadcrumb: 'Monitoring Lembur' },
  },
  // Modul Payroll (Khusus Admin)
  {
    path: '/payroll',
    redirect: '/payroll/komponen',
    meta: { requiresAdmin: true },
  },
  {
    path: '/payroll/komponen',
    name: 'KomponenGaji',
    component: () => import('../pages/payroll/KomponenGaji.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Komponen Gaji' },
  },
  {
    path: '/payroll/komponen/tambah',
    name: 'KomponenGajiTambah',
    component: () => import('../pages/payroll/KomponenGajiForm.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Tambah Komponen Gaji' },
  },
  {
    path: '/payroll/komponen/:kode/ubah',
    name: 'KomponenGajiUbah',
    component: () => import('../pages/payroll/KomponenGajiForm.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Ubah Komponen Gaji' },
  },
  {
    path: '/payroll/grade',
    name: 'GradePegawai',
    component: () => import('../pages/payroll/GradePegawai.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Grade Pegawai' },
  },
  {
    path: '/payroll/grade/tambah',
    name: 'GradePegawaiTambah',
    component: () => import('../pages/payroll/GradePegawaiForm.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Tambah Grade Pegawai' },
  },
  {
    path: '/payroll/grade/:kode/ubah',
    name: 'GradePegawaiUbah',
    component: () => import('../pages/payroll/GradePegawaiForm.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Ubah Grade Pegawai' },
  },
  {
    path: '/payroll/eselon',
    name: 'EselonJabatan',
    component: () => import('../pages/payroll/EselonJabatan.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Eselon / Level Jabatan' },
  },
  {
    path: '/payroll/eselon/tambah',
    name: 'EselonJabatanTambah',
    component: () => import('../pages/payroll/EselonJabatanForm.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Tambah Eselon' },
  },
  {
    path: '/payroll/eselon/:kode/ubah',
    name: 'EselonJabatanUbah',
    component: () => import('../pages/payroll/EselonJabatanForm.vue'),
    meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: 'Ubah Eselon' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const isAuthenticated = localStorage.getItem('authenticated') === 'true';
  const user = readUser();
  const isPublic = to.meta.public === true;

  if (!isPublic && !isAuthenticated) {
    return next('/login');
  }

  if (isPublic && isAuthenticated) {
    return next(homeFor(user));
  }

  if (to.meta.requiresAdmin) {
    try {
      const raw = localStorage.getItem('bmis_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.role === 'employee' || u.role === 'user') {
          return next('/presensi/user');
        }
      } else {
        return next('/login');
      }
    } catch {
      return next('/login');
    }
  }

  next();
});

export default router;
