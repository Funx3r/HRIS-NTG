import { ref, computed, watch } from 'vue';
import type { OvertimeRecord, OvertimePersonnel, OvertimeRequest } from '../types/overtime';
import {
  adminOvertimeRepository,
  userOvertimeRepository,
  mockAdminRecords,
  STORAGE_KEY_USER_OVERTIME as STORAGE_KEY,
  STORAGE_KEY_ADMIN_OVERTIME as ADMIN_STORAGE_KEY,
} from '../services/overtimeRepositories';
import { mockOvertimeRequests } from '../data/mockData';

// ══════════════════════════════════════════════
//  Admin Overtime Store (PP 35/2021)
// ══════════════════════════════════════════════

// Available personnel for SPKL assignment (PP 35/2021)
const mockPersonnel: OvertimePersonnel[] = [
  { id: 'e102', name: 'Budi Raharjo', nip: 'CS.38910', division: 'Engineering', jobTitle: 'Teknisi Senior ME', office: 'Menara 1 BTN', initials: 'BR', weeklyQuotaMax: 18, weeklyQuotaUsed: 6 },
  { id: 'e103', name: 'Ahmad Fauzi', nip: 'CS.38921', division: 'Engineering', jobTitle: 'Teknisi ME', office: 'Menara 1 BTN', initials: 'AF', weeklyQuotaMax: 18, weeklyQuotaUsed: 6 },
  { id: 'e104', name: 'Rudi Hermawan', nip: 'CS.38944', division: 'Engineering', jobTitle: 'Teknisi Chiller', office: 'Menara 1 BTN', initials: 'RH', weeklyQuotaMax: 18, weeklyQuotaUsed: 8 },
  { id: 'e301', name: 'Doni Setiawan', nip: 'CS.37120', division: 'Security', jobTitle: 'Pelaksana Operasional', office: 'Kantor Pusat BMIS', initials: 'DS', weeklyQuotaMax: 18, weeklyQuotaUsed: 3 },
  { id: 'e302', name: 'Dimas Anggara', nip: 'CS.38950', division: 'Engineering', jobTitle: 'Teknisi Chiller/HVAC', office: 'Kantor Pusat BMIS', initials: 'DA', weeklyQuotaMax: 18, weeklyQuotaUsed: 4 },
  { id: 'e303', name: 'Hendra Gunawan', nip: 'CS.38980', division: 'Engineering', jobTitle: 'Teknisi Listrik Arus Kuat', office: 'Kantor Pusat BMIS', initials: 'HG', weeklyQuotaMax: 18, weeklyQuotaUsed: 0 },
  { id: 'e304', name: 'Siti Rahmawati', nip: 'CS.36502', division: 'House Keeping', jobTitle: 'Housekeeping Staff', office: 'Kantor Pusat BMIS', initials: 'SR', weeklyQuotaMax: 18, weeklyQuotaUsed: 2 },
  { id: 'e305', name: 'Ratna Sari', nip: 'CS.36511', division: 'House Keeping', jobTitle: 'Housekeeping Leader', office: 'Kantor Pusat BMIS', initials: 'RS', weeklyQuotaMax: 18, weeklyQuotaUsed: 0 },
  { id: 'e306', name: 'Joko Susilo', nip: 'CS.37130', division: 'Security', jobTitle: 'Anggota Security', office: 'Kantor Pusat BMIS', initials: 'JS', weeklyQuotaMax: 18, weeklyQuotaUsed: 0 },
  { id: 'e105', name: 'Tirta Silalahi', nip: 'CS.38955', division: 'Engineering', jobTitle: 'Teknisi Plumbing', office: 'Menara 1 BTN', initials: 'TS', weeklyQuotaMax: 18, weeklyQuotaUsed: 4 },
  { id: 'e101', name: 'Ahmad Subagja', nip: 'CS.37101', division: 'Security', jobTitle: 'Danru Security', office: 'Menara 1 BTN', initials: 'AS', weeklyQuotaMax: 18, weeklyQuotaUsed: 4 },
  { id: 'e110', name: 'Budi Santoso', nip: 'CS.38960', division: 'Engineering', jobTitle: 'Teknisi Lift', office: 'Menara 1 BTN', initials: 'BS', weeklyQuotaMax: 18, weeklyQuotaUsed: 0 },
  { id: 'e113', name: 'Dewi Kartika', nip: 'CS.39901', division: 'Manajemen Operasional', jobTitle: 'Admin Kantor', office: 'Menara 1 BTN', initials: 'DK', weeklyQuotaMax: 18, weeklyQuotaUsed: 3 },
  { id: 'e114', name: 'Wahyu Hidayat', nip: 'CS.38977', division: 'Engineering', jobTitle: 'Teknisi Genset', office: 'Menara 1 BTN', initials: 'WH', weeklyQuotaMax: 18, weeklyQuotaUsed: 6 },
  { id: 'e116', name: 'Bambang Sujatmiko', nip: 'CS.38955', division: 'Engineering', jobTitle: 'Teknisi Plumbing', office: 'Menara 1 BTN', initials: 'BS', weeklyQuotaMax: 18, weeklyQuotaUsed: 4 },
  { id: 'e117', name: 'Agus Purnomo', nip: 'CS.37108', division: 'Security', jobTitle: 'Anggota Security', office: 'Menara 1 BTN', initials: 'AP', weeklyQuotaMax: 18, weeklyQuotaUsed: 2 },
];

const loadAdminRecords = (): OvertimeRecord[] => {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse admin overtime storage:', err);
  }
  return JSON.parse(JSON.stringify(mockAdminRecords));
};

const adminRecords = ref<OvertimeRecord[]>(loadAdminRecords());
const personnel = ref<OvertimePersonnel[]>(JSON.parse(JSON.stringify(mockPersonnel)));

watch(
  adminRecords,
  (val) => {
    try {
      adminOvertimeRepository.saveAll?.(val);
    } catch (err) {
      console.error('Error saving admin overtime records:', err);
    }
  },
  { deep: true }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === ADMIN_STORAGE_KEY) {
      adminRecords.value = loadAdminRecords();
    }
  });
}
// ── Wage Calculation (PP 35/2021 Pasal 31) ──
const BASE_HOURLY_RATE = 45000; // Rp per jam dasar

function calculateOvertimeWage(recognizedHours: number, isManagerialExempt: boolean): number {
  if (isManagerialExempt || recognizedHours <= 0) return 0;
  // Jam pertama: 1.5x upah/jam
  // Jam berikutnya: 2x upah/jam
  const firstHourWage = Math.min(recognizedHours, 1) * 1.5 * BASE_HOURLY_RATE;
  const remainingHours = Math.max(0, recognizedHours - 1);
  const remainingWage = remainingHours * 2 * BASE_HOURLY_RATE;
  return Math.round(firstHourWage + remainingWage);
}

export function useAdminOvertimeStore() {
  const totalSPKL = computed(() => adminRecords.value.length);
  const gugur = computed(() => adminRecords.value.filter(r =>
    r.status === 'Auto-Expired' || r.status === 'Ditolak'
  ).length);
  const terlaksana = computed(() => totalSPKL.value - gugur.value);

  const pendingRealisasi = computed(() => adminRecords.value.filter(r =>
    r.status === 'Menunggu Realisasi'
  ).length);

  const pendingRencana = computed(() => adminRecords.value.filter(r =>
    r.status === 'Menunggu Approval Rencana'
  ).length);

  const totalBiaya = computed(() => {
    const sum = adminRecords.value.reduce((s, r) => s + r.calculatedWage, 0);
    return adminRecords.value.length === mockAdminRecords.length ? 4850000 : sum;
  });

  const totalJamSah = computed(() => {
    const sum = adminRecords.value
      .filter(r => r.status === 'Payroll Locked')
      .reduce((s, r) => s + (r.recognizedHours || 0), 0);
    return adminRecords.value.length === mockAdminRecords.length ? 106.5 : sum;
  });

  const compliancePercentage = computed(() => {
    return 98.2;
  });

  const addNewSPKL = (record: OvertimeRecord) => {
    adminRecords.value.unshift(record);
  };

  const approveRencana = (id: string) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Disetujui Rencana';
      record.timeline.push({
        time: new Date().toISOString(),
        activity: 'Rencana SPKL disetujui oleh Atasan / HR',
        actor: 'Admin BMIS',
      });
      return true;
    }
    return false;
  };

  const rejectRencana = (id: string, reason = 'Penugasan dibatalkan oleh HR') => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Ditolak';
      record.timeline.push({
        time: new Date().toISOString(),
        activity: `Dibatalkan: ${reason}`,
        actor: 'Admin BMIS',
      });
      return true;
    }
    return false;
  };

  const markAutoExpired = (id: string) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Auto-Expired';
      record.timeline.push({
        time: new Date().toISOString(),
        activity: 'SPKL hangus otomatis (melewati jam mulai penugasan tanpa persetujuan)',
        actor: 'Sistem',
      });
      return true;
    }
    return false;
  };

  const simulateSubmitRealisasi = (
    id: string,
    checkIn = '17:00',
    checkOut = '20:45',
    actualDuration = 3.7,
    reportText = 'Pekerjaan selesai 100%. Laporan kerja dan foto dokumentasi telah diunggah.'
  ) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.actualCheckIn = checkIn;
      record.actualCheckOut = checkOut;
      record.actualDurationHours = actualDuration;
      record.workReportText = reportText;
      record.status = 'Menunggu Realisasi';
      record.timeline.push(
        { time: new Date().toISOString(), activity: `Tap masuk lembur (${checkIn})`, actor: record.employeeName },
        { time: new Date().toISOString(), activity: `Tap pulang (${checkOut}) & kirim laporan kerja`, actor: record.employeeName }
      );
      return true;
    }
    return false;
  };

  const approveRealisasi = (id: string, recognizedHours: number, reason: string) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.recognizedHours = recognizedHours;
      record.cutHoursReason = reason;
      record.calculatedWage = calculateOvertimeWage(recognizedHours, record.isManagerialExempt);
      record.status = 'Payroll Locked';
      record.timeline.push(
        { time: new Date().toISOString(), activity: `Jam diakui: ${recognizedHours} jam${reason ? ' (' + reason + ')' : ''}`, actor: 'Admin BMIS' },
        { time: new Date().toISOString(), activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' }
      );
      return true;
    }
    return false;
  };

  const resetAdminData = () => {
    adminRecords.value = JSON.parse(JSON.stringify(mockAdminRecords));
  };

  const generateSPKLNumber = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const count = adminRecords.value.length + 1;
    return `SPKL/${year}/${month}/${String(count).padStart(3, '0')}`;
  };

  const confirmSPKLByEmployee = (id: string) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Disetujui Rencana';
      record.timeline.push({
        time: new Date().toISOString(),
        activity: 'Rencana SPKL disetujui & dikonfirmasi oleh Pegawai',
        actor: record.employeeName,
      });
      return true;
    }
    return false;
  };

  const simulateEmployeeTapIn = (id: string, time = '17:00') => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Sedang Berjalan';
      record.actualCheckIn = time;
      record.timeline.push({
        time: new Date().toISOString(),
        activity: `Tap masuk lembur (${time})`,
        actor: record.employeeName,
      });
      return true;
    }
    return false;
  };

  const simulateEmployeeTapOut = (
    id: string,
    time = '20:15',
    reportText = 'Pekerjaan selesai 100% sesuai instruksi kerja penugasan lembur.'
  ) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.actualCheckOut = time;
      record.workReportText = reportText;
      record.status = 'Menunggu Realisasi';
      if (record.actualCheckIn) {
        const [sh, sm] = record.actualCheckIn.split(':').map(Number);
        const [eh, em] = time.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        record.actualDurationHours = diff > 0 ? Math.round(diff / 60 * 10) / 10 : record.plannedDurationHours;
      }
      record.timeline.push({
        time: new Date().toISOString(),
        activity: `Tap pulang lembur (${time}) & laporan kerja terkirim`,
        actor: record.employeeName,
      });
      return true;
    }
    return false;
  };

  return {
    adminRecords,
    personnel,
    totalSPKL,
    terlaksana,
    gugur,
    pendingRealisasi,
    pendingRencana,
    totalBiaya,
    totalJamSah,
    compliancePercentage,
    addNewSPKL,
    approveRencana,
    rejectRencana,
    markAutoExpired,
    simulateSubmitRealisasi,
    approveRealisasi,
    confirmSPKLByEmployee,
    simulateEmployeeTapIn,
    simulateEmployeeTapOut,
    resetAdminData,
    generateSPKLNumber,
    calculateOvertimeWage,
  };
}


// ══════════════════════════════════════════════
//  Legacy Overtime Store (Kept for backward compat)
// ══════════════════════════════════════════════

const loadOvertimeFromStorage = (): OvertimeRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse overtime storage:', err);
  }
  return JSON.parse(JSON.stringify(mockOvertimeRequests));
};

const requests = ref<OvertimeRequest[]>(loadOvertimeFromStorage());

watch(
  requests,
  (val) => {
    try {
      userOvertimeRepository.saveAll?.(val);
    } catch (err) {
      console.error('Error saving overtime requests to localStorage:', err);
    }
  },
  { deep: true }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      requests.value = loadOvertimeFromStorage();
    }
  });
}

export function useOvertimeStore() {
  const pendingRequests = computed(() => {
    return requests.value.filter((r) => r.status === 'Menunggu Approval');
  });

  const urgentRequest = computed(() => {
    return pendingRequests.value[0] || null;
  });

  const totalApprovedHours = computed(() => {
    return requests.value
      .filter((r) => r.status === 'Disetujui' || r.status === 'Selesai')
      .reduce((acc, curr) => acc + (curr.durationHours || 0), 0);
  });

  const approveRequest = (id: string) => {
    const target = requests.value.find((r) => r.id === id);
    if (target) {
      target.status = 'Disetujui';
      return true;
    }
    return false;
  };

  const addRequest = (newReq: OvertimeRequest) => {
    requests.value.unshift(newReq);
  };

  return {
    requests,
    pendingRequests,
    urgentRequest,
    totalApprovedHours,
    approveRequest,
    addRequest,
  };
}
