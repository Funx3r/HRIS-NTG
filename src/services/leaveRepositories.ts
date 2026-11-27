import { createLocalRepository, type Repository } from './repository';

export interface ApprovalStep {
  level: string;
  role: string;
  name?: string;
  status: 'Disetujui' | 'Ditolak' | 'Menunggu';
  statusText: string;
  timestamp?: string;
  notes?: string;
  badge?: string;
  description?: string;
}

export interface LeaveRecord {
  id: string;
  empId: string;
  empName: string;
  initials: string;
  avatarColor: string;
  department: string;
  leaveType: string;
  categoryTag?: string;
  startDate?: string;
  endDate?: string;
  dateRange: string;
  dateRangeLabel?: string;
  durationDays: number;
  shiftLabel?: string;
  status: 'Menunggu HR' | 'Menunggu Approval' | 'Menunggu' | 'Menunggu Surat Dokter' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';
  statusLabel?: string;
  submitDate: string;
  reason: string;
  attachmentName?: string;
  attachmentSize?: string;
  approver?: string;
  rejectionReason?: string;
  processedDate?: string;
  processedBy?: string;
  approvalSteps?: ApprovalStep[];
}

export interface EmployeeQuota {
  empId: string;
  empName: string;
  initials: string;
  avatarColor: string;
  department: string;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  status: 'Aktif' | 'Cuti Panjang';
}

export const STORAGE_KEY_LEAVES = 'bmis_shared_leave_records_v4';
export const STORAGE_KEY_QUOTAS = 'bmis_shared_quota_records_v4';

export const defaultSeedLeaves: LeaveRecord[] = [];

export const defaultSeedQuotas: EmployeeQuota[] = [
  {
    empId: 'EMP-031',
    empName: 'Asep Milo',
    initials: 'AM',
    avatarColor: 'bg-blue-100 text-[#0084c4]',
    department: 'Housekeeping',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif',
  },
  {
    empId: 'EMP-1001',
    empName: 'Dimas Ukin',
    initials: 'DU',
    avatarColor: 'bg-slate-100 text-slate-700',
    department: 'Operasional Lapangan',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif',
  },
  {
    empId: 'EMP-1002',
    empName: 'Irfan Fadhiil',
    initials: 'IF',
    avatarColor: 'bg-teal-100 text-teal-700',
    department: 'Logistik & Gudang',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif',
  },
  {
    empId: 'EMP-1005',
    empName: 'Farhan Rashidin',
    initials: 'FR',
    avatarColor: 'bg-purple-100 text-purple-700',
    department: 'Operator Alat Berat',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif',
  },
  {
    empId: 'EMP-1008',
    empName: 'Rian Hidayat',
    initials: 'RH',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    department: 'Security',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif',
  },
  {
    empId: 'EMP-1009',
    empName: 'Bagus Wicaksono',
    initials: 'BW',
    avatarColor: 'bg-amber-100 text-amber-700',
    department: 'ME',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif',
  },
];

export const leaveRepository = createLocalRepository<LeaveRecord>({
  key: STORAGE_KEY_LEAVES,
  seed: defaultSeedLeaves,
  idOf: (item) => item.id,
});

export const leaveQuotaRepository = createLocalRepository<EmployeeQuota>({
  key: STORAGE_KEY_QUOTAS,
  seed: defaultSeedQuotas,
  idOf: (item) => item.empId,
});
