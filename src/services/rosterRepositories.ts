import { createLocalRepository, type Repository } from './repository';
import type { RosterTeam } from '../types/roster';
import { mockRosterTeams } from '../data/mockData';

export interface ShiftSwapRecord {
  id: string;
  requesterId: string;
  requesterName: string;
  colleagueId: string;
  colleagueName: string;
  swapDate: string;
  myShift: string;
  colleagueShift: string;
  status: 'Menunggu Approval' | 'Disetujui' | 'Ditolak';
  colleagueApproved: boolean;
  restValidationNotes: string;
  reason?: string;
  createdAt?: string;
}

export const STORAGE_KEY_TEAMS = 'bmis_shared_roster_teams_v1';
export const STORAGE_KEY_SWAPS = 'bmis_shared_shift_swaps_v1';

export const defaultSeedSwaps: ShiftSwapRecord[] = [
  {
    id: 'swap-001',
    requesterId: 'e301',
    requesterName: 'Ahmad Fauzi',
    colleagueId: 'e102',
    colleagueName: 'Budi Raharjo',
    swapDate: 'Besok',
    myShift: 'Shift 1 (07:00 - 15:00)',
    colleagueShift: 'Shift 2 (15:00 - 23:00)',
    status: 'Menunggu Approval',
    colleagueApproved: true,
    restValidationNotes: 'Telah divalidasi tidak melanggar batas jeda istirahat 11 jam.',
    reason: 'Kebutuhan keluarga mendesak',
    createdAt: 'Hari ini, 09:30 WIB',
  },
];

export const rosterTeamRepository = createLocalRepository<RosterTeam>({
  key: STORAGE_KEY_TEAMS,
  seed: mockRosterTeams,
  idOf: (item) => item.id,
});

export const shiftSwapRepository = createLocalRepository<ShiftSwapRecord>({
  key: STORAGE_KEY_SWAPS,
  seed: defaultSeedSwaps,
  idOf: (item) => item.id,
});
