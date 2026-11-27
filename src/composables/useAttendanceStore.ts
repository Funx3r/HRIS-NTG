import { ref, watch } from 'vue';
import {
  attendanceRepository,
  defaultAttendanceSeedRecords,
  type EmployeeAttendanceRecord,
  getTodayDateStr,
  ATTENDANCE_STORAGE_KEY as STORAGE_KEY,
} from '../services/attendanceRepository';

export type { EmployeeAttendanceRecord };
export { getTodayDateStr };

const DATE_TRACKER_KEY = 'bmis_last_attendance_date';
const CLEAN_RESET_KEY = 'bmis_clean_reset_today_v3';

const defaultSeedRecords: EmployeeAttendanceRecord[] = defaultAttendanceSeedRecords;

const loadFromStorage = (): EmployeeAttendanceRecord[] => {
  const today = getTodayDateStr();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const lastDate = localStorage.getItem(DATE_TRACKER_KEY);
    const hasCleanReset = localStorage.getItem(CLEAN_RESET_KEY);

    if (raw) {
      let parsed: EmployeeAttendanceRecord[] = JSON.parse(raw);

      // 1. Jika tanggal sistem berganti (ganti hari) ATAU reset bersih v3 belum pernah dipicu:
      if (lastDate !== today || !hasCleanReset) {
        localStorage.setItem(DATE_TRACKER_KEY, today);
        localStorage.setItem(CLEAN_RESET_KEY, 'true');

        // Cari record Asep Milo untuk hari ini jika sudah ada
        const asepTodayIdx = parsed.findIndex(
          (r) =>
            (r.employee_name.toLowerCase() === 'asep milo' ||
             String(r.user_id) === 'usr-employee-asep' ||
             String(r.user_id) === 'emp-301') &&
            r.date === today
        );

        if (asepTodayIdx >= 0) {
          // Bersihkan data hari ini menjadi default belum tap masuk
          parsed[asepTodayIdx] = {
            user_id: 'usr-employee-asep',
            employee_name: 'Asep Milo',
            employee_code: 'CS.50101',
            role_name: 'Engineering',
            date: today,
            check_in: null,
            check_out: null,
            late_duration_minutes: 0,
            status: 'ABSENT',
            location: '-',
          };
        } else {
          // Buat record baru hari ini yang masih kosong (belum tap masuk)
          parsed.unshift({
            user_id: 'usr-employee-asep',
            employee_name: 'Asep Milo',
            employee_code: 'CS.50101',
            role_name: 'Engineering',
            date: today,
            check_in: null,
            check_out: null,
            late_duration_minutes: 0,
            status: 'ABSENT',
            location: '-',
          });
        }

        // Hapus juga record Asep Milo yang membawa sisa data tes lama (15:13)
        parsed.forEach((r) => {
          if (
            (r.employee_name.toLowerCase() === 'asep milo' ||
             String(r.user_id) === 'usr-employee-asep' ||
             String(r.user_id) === 'emp-301') &&
            r.check_in === '15:13'
          ) {
            r.check_in = null;
            r.check_out = null;
            r.late_duration_minutes = 0;
            r.status = 'ABSENT';
          }
        });

        // Perbarui tanggal record rekan kerja default agar sinkron ke hari ini
        parsed.forEach((r) => {
          if (r.employee_name.toLowerCase() !== 'asep milo' && String(r.user_id) !== 'usr-employee-asep') {
            r.date = today;
          }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }

      // Pastikan record Asep Milo hari ini selalu ada
      const hasAsepToday = parsed.some(
        (r) =>
          (r.employee_name.toLowerCase() === 'asep milo' ||
           String(r.user_id) === 'usr-employee-asep' ||
           String(r.user_id) === 'emp-301') &&
          r.date === today
      );
      if (!hasAsepToday) {
        parsed.unshift({
          user_id: 'usr-employee-asep',
          employee_name: 'Asep Milo',
          employee_code: 'CS.50101',
          role_name: 'Engineering',
          date: today,
          check_in: null,
          check_out: null,
          late_duration_minutes: 0,
          status: 'ABSENT',
          location: '-',
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }

      // Sinkronkan catatan jika Asep Milo sudah check_out hari ini tapi catatannya masih sisa alasan lama
      let needSave = false;
      parsed.forEach((r) => {
        if (
          (r.employee_name.toLowerCase() === 'asep milo' ||
           String(r.user_id) === 'usr-employee-asep') &&
          r.check_out &&
          r.notes?.includes('Kemacetan') &&
          !r.notes?.includes('Pulang Cepat')
        ) {
          r.notes = 'Pulang Cepat: Izin Sakit - cepirit';
          needSave = true;
        }
      });
      if (needSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }

      return parsed;
    }
  } catch (e) {
    console.error('Error loading attendance from localStorage:', e);
  }

  localStorage.setItem(DATE_TRACKER_KEY, today);
  localStorage.setItem(CLEAN_RESET_KEY, 'true');
  const initial = JSON.parse(JSON.stringify(defaultSeedRecords));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
};

// Global Reactive Ref Shared Across Components
const records = ref<EmployeeAttendanceRecord[]>(loadFromStorage());

// Sync changes to localStorage
watch(
  records,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch (e) {
      console.error('Error saving attendance to localStorage:', e);
    }
  },
  { deep: true }
);

// Dengarkan event storage dari tab browser lain
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      records.value = loadFromStorage();
    }
  });
}

export function useAttendanceStore() {
  const refreshRecords = () => {
    records.value = loadFromStorage();
  };

  /**
   * Catat Check-In Pegawai (Dipanggil saat klik MASUK di UserPresensi)
   */
  const recordCheckIn = (params: {
    userId: string | number;
    userName: string;
    userCode: string;
    roleName: string;
    checkInTime: string;
    isLate: boolean;
    lateMinutes: number;
    location?: string;
    notes?: string;
  }) => {
    refreshRecords();
    const today = getTodayDateStr();
    const cleanTime = params.checkInTime.replace(/\./g, ':');

    // Cari index berdasarkan user_id ATAU nama karyawan DENGAN tanggal hari ini
    const existingIndex = records.value.findIndex(
      (r) =>
        (String(r.user_id) === String(params.userId) ||
         r.employee_name.toLowerCase() === params.userName.toLowerCase()) &&
        r.date === today
    );

    const defaultNotes = params.isLate
      ? `Keterlambatan ${params.lateMinutes} menit`
      : 'Hadir Tepat Waktu';

    const updatedRecord: EmployeeAttendanceRecord = {
      user_id: params.userId,
      employee_name: params.userName,
      employee_code: params.userCode,
      role_name: params.roleName,
      date: today,
      check_in: cleanTime,
      check_out: null,
      late_duration_minutes: params.isLate ? params.lateMinutes : 0,
      status: params.isLate ? 'LATE' : 'ON_TIME',
      location: params.location || 'Menara 1 BTN (Radius 15m)',
      notes: params.notes || defaultNotes,
    };

    if (existingIndex >= 0) {
      // Hapus dari posisi lama dan pindahkan ke paling atas (index 0) agar langsung tampak di Monitoring Admin
      records.value.splice(existingIndex, 1);
      records.value.unshift(updatedRecord);
    } else {
      records.value.unshift(updatedRecord);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
  };

  /**
   * Catat Check-Out Pegawai (Dipanggil saat konfirmasi KELUAR di UserPresensi)
   */
  const recordCheckOut = (userId: string | number, checkOutTime: string, userName?: string, notes?: string) => {
    refreshRecords();
    const today = getTodayDateStr();
    const cleanTime = checkOutTime.replace(/\./g, ':');
    const target = records.value.find(
      (r) =>
        (String(r.user_id) === String(userId) ||
         (userName && r.employee_name.toLowerCase() === userName.toLowerCase())) &&
        r.date === today
    );

    if (target) {
      target.check_out = cleanTime;
      if (notes) {
        target.notes = notes;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
    }
  };

  /**
   * Input Presensi Manual oleh Admin (Dipanggil di AdminPresensi)
   */
  const recordManualAttendance = (payload: {
    employeeId: string | number;
    date: string;
    checkIn: string;
    checkOut: string;
    status: 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT';
    notes?: string;
  }) => {
    refreshRecords();
    const cleanIn = payload.checkIn.replace(/\./g, ':');
    const cleanOut = payload.checkOut.replace(/\./g, ':');
    const target = records.value.find((r) => String(r.user_id) === String(payload.employeeId));
    if (target) {
      target.date = payload.date;
      target.check_in = payload.status === 'ABSENT' || payload.status === 'LEAVE' ? null : cleanIn;
      target.check_out = payload.status === 'ABSENT' || payload.status === 'LEAVE' ? null : cleanOut;
      target.status = payload.status;
      target.notes = payload.notes;

      if (cleanIn && payload.status === 'LATE') {
        const [h, m] = cleanIn.split(':').map(Number);
        const diff = (h - 8) * 60 + m;
        target.late_duration_minutes = diff > 0 ? diff : 15;
      } else {
        target.late_duration_minutes = 0;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
    }
  };

  /**
   * Pengajuan Izin / Cuti / Sakit Karyawan (Dipanggil dari UserPresensi)
   */
  const recordLeave = (params: {
    userId: string | number;
    userName: string;
    userCode: string;
    roleName: string;
    leaveType: string;
    date?: string;
    notes: string;
    attachmentName?: string;
  }) => {
    refreshRecords();
    const targetDate = params.date || getTodayDateStr();

    const existingIndex = records.value.findIndex(
      (r) =>
        (String(r.user_id) === String(params.userId) ||
         r.employee_name.toLowerCase() === params.userName.toLowerCase()) &&
        r.date === targetDate
    );

    const fullNote = params.attachmentName
      ? `${params.leaveType}: ${params.notes} [Lampiran: ${params.attachmentName}]`
      : `${params.leaveType}: ${params.notes}`;

    const updatedRecord: EmployeeAttendanceRecord = {
      user_id: params.userId,
      employee_name: params.userName,
      employee_code: params.userCode,
      role_name: params.roleName,
      date: targetDate,
      check_in: null,
      check_out: null,
      late_duration_minutes: 0,
      status: 'LEAVE',
      location: '-',
      notes: fullNote,
    };

    if (existingIndex >= 0) {
      records.value.splice(existingIndex, 1);
      records.value.unshift(updatedRecord);
    } else {
      records.value.unshift(updatedRecord);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
  };

  /**
   * Approval Catatan Alasan Keterlambatan oleh Admin
   */
  const approveAttendanceNote = (userId: string | number, date?: string) => {
    refreshRecords();
    const target = records.value.find(
      (r) => String(r.user_id) === String(userId) && (!date || r.date === date)
    );

    if (target) {
      if (!target.notes?.includes('(Disetujui Admin)')) {
        target.notes = `${target.notes || 'Terlambat'} (Disetujui Admin)`;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
    }
  };

  /**
   * Hapus Record Absensi oleh Admin
   */
  const deleteRecord = (userId: string | number) => {
    refreshRecords();
    const idx = records.value.findIndex((r) => String(r.user_id) === String(userId));
    if (idx >= 0) {
      records.value.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
    }
  };

  const getRecordForUser = (userId: string | number, userName?: string, date = getTodayDateStr()) => {
    refreshRecords();
    return records.value.find(
      (r) =>
        (String(r.user_id) === String(userId) ||
         (userName && r.employee_name.toLowerCase() === userName.toLowerCase())) &&
        r.date === date
    );
  };

  /**
   * Reset paksa presensi hari ini untuk pegawai tertentu (kembali ke belum presensi)
   */
  const resetUserTodayAttendance = (userId: string | number, userName?: string, date = getTodayDateStr()) => {
    refreshRecords();
    const target = records.value.find(
      (r) =>
        (String(r.user_id) === String(userId) ||
         (userName && r.employee_name.toLowerCase() === userName.toLowerCase())) &&
        r.date === date
    );
    if (target) {
      target.check_in = null;
      target.check_out = null;
      target.late_duration_minutes = 0;
      target.status = 'ABSENT';
      target.location = '-';
      target.notes = undefined;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
    }
  };

  return {
    records,
    refreshRecords,
    recordCheckIn,
    recordCheckOut,
    recordManualAttendance,
    recordLeave,
    approveAttendanceNote,
    deleteRecord,
    getRecordForUser,
    resetUserTodayAttendance,
  };
}
