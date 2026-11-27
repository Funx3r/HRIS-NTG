import { createLocalRepository, type Repository } from './repository';

export interface EmployeeAttendanceRecord {
  user_id: string | number;
  employee_name: string;
  employee_code: string;
  role_name: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  late_duration_minutes: number;
  status: 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT';
  notes?: string;
  location?: string;
}

export const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const defaultAttendanceSeedRecords: EmployeeAttendanceRecord[] = [
  {
    user_id: 'usr-employee-asep',
    employee_name: 'Asep Milo',
    employee_code: 'CS.50101',
    role_name: 'Engineering',
    date: getTodayDateStr(),
    check_in: null,
    check_out: null,
    late_duration_minutes: 0,
    status: 'ABSENT',
    location: '-',
  },
  {
    user_id: 'e101',
    employee_name: 'Ahmad Subagja',
    employee_code: 'CS.37101',
    role_name: 'Security',
    date: getTodayDateStr(),
    check_in: '07:55',
    check_out: '17:02',
    late_duration_minutes: 0,
    status: 'ON_TIME',
    location: 'Menara 1 BTN (Radius 12m)',
  },
  {
    user_id: 'e103',
    employee_name: 'Candra Wijaya',
    employee_code: 'CS.38942',
    role_name: 'Engineering',
    date: getTodayDateStr(),
    check_in: '08:15',
    check_out: '17:05',
    late_duration_minutes: 15,
    status: 'LATE',
    location: 'Menara 1 BTN (Radius 25m)',
  },
  {
    user_id: 'e106',
    employee_name: 'Siti Rahmawati',
    employee_code: 'CS.36502',
    role_name: 'Housekeeping',
    date: getTodayDateStr(),
    check_in: '07:50',
    check_out: '17:00',
    late_duration_minutes: 0,
    status: 'ON_TIME',
    location: 'Menara 1 BTN (Radius 15m)',
  },
  {
    user_id: 'e102',
    employee_name: 'Bambang Pamungkas',
    employee_code: 'CS.37105',
    role_name: 'Security',
    date: getTodayDateStr(),
    check_in: '08:25',
    check_out: '17:10',
    late_duration_minutes: 25,
    status: 'LATE',
    location: 'Menara 1 BTN (Radius 18m)',
  },
  {
    user_id: 'e108',
    employee_name: 'Agus Prabowo',
    employee_code: 'CS.37125',
    role_name: 'Security',
    date: getTodayDateStr(),
    check_in: null,
    check_out: null,
    late_duration_minutes: 0,
    status: 'LEAVE',
    notes: 'Cuti Sakit Resmi',
    location: '-',
  },
  {
    user_id: 'e104',
    employee_name: 'Dimas Anggara',
    employee_code: 'CS.38950',
    role_name: 'Engineering',
    date: getTodayDateStr(),
    check_in: '07:58',
    check_out: '17:00',
    late_duration_minutes: 0,
    status: 'ON_TIME',
    location: 'Menara 1 BTN (Radius 10m)',
  },
  {
    user_id: 'e107',
    employee_name: 'Dedi Supriyadi',
    employee_code: 'CS.34011',
    role_name: 'Housekeeping',
    date: getTodayDateStr(),
    check_in: null,
    check_out: null,
    late_duration_minutes: 0,
    status: 'ABSENT',
    notes: 'Tanpa Keterangan',
    location: '-',
  },
  {
    user_id: 'e113',
    employee_name: 'Dewi Kartika',
    employee_code: 'CS.39901',
    role_name: 'Admin Unit',
    date: getTodayDateStr(),
    check_in: '07:52',
    check_out: '17:01',
    late_duration_minutes: 0,
    status: 'ON_TIME',
    location: 'Menara 1 BTN (Radius 8m)',
  },
];

export const ATTENDANCE_STORAGE_KEY = 'bmis_shared_attendance_records';

export const attendanceRepository = createLocalRepository<EmployeeAttendanceRecord>({
  key: ATTENDANCE_STORAGE_KEY,
  seed: defaultAttendanceSeedRecords,
  idOf: (r) => `${r.user_id}_${r.date}`,
});
