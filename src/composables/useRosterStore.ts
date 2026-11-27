import { ref, computed, watch } from 'vue';
import type { RosterTeam } from '../types/roster';
import {
  type ShiftSwapRecord,
  STORAGE_KEY_TEAMS,
  STORAGE_KEY_SWAPS,
  defaultSeedSwaps,
  rosterTeamRepository,
  shiftSwapRepository,
} from '../services/rosterRepositories';
import { mockRosterTeams } from '../data/mockData';
import { normalizeTeamPeriod } from '../utils/rosterDate';

export type { ShiftSwapRecord };

const loadTeams = (): RosterTeam[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (raw) {
      const parsed = JSON.parse(raw) as RosterTeam[];
      return parsed.map((team) => {
        const period = normalizeTeamPeriod(team.startDate, team.endDate);
        return { ...team, ...period };
      });
    }
  } catch (err) {
    console.error('Failed to parse teams storage:', err);
  }
  const initial = JSON.parse(JSON.stringify(mockRosterTeams)) as RosterTeam[];
  return initial.map((team) => {
    const period = normalizeTeamPeriod(team.startDate, team.endDate);
    return { ...team, ...period };
  });
};

const loadSwaps = (): ShiftSwapRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SWAPS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse swaps storage:', err);
  }
  return JSON.parse(JSON.stringify(defaultSeedSwaps));
};

const teams = ref<RosterTeam[]>(loadTeams());
const swapRequests = ref<ShiftSwapRecord[]>(loadSwaps());

watch(
  teams,
  (val) => {
    try {
      rosterTeamRepository.saveAll?.(val);
    } catch (e) {
      console.error(e);
    }
  },
  { deep: true }
);

watch(
  swapRequests,
  (val) => {
    try {
      shiftSwapRepository.saveAll?.(val);
    } catch (e) {
      console.error(e);
    }
  },
  { deep: true }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_TEAMS) teams.value = loadTeams();
    if (e.key === STORAGE_KEY_SWAPS) swapRequests.value = loadSwaps();
  });
}

export function useRosterStore() {
  const activeTeams = computed(() => {
    return teams.value.filter((t) => t.status === 'Aktif');
  });

  const activeTeam = computed(() => {
    return activeTeams.value[0] || teams.value[0];
  });

  const totalActivePersonnel = computed(() => {
    return activeTeams.value.reduce((acc, t) => acc + (t.personelCount || 0), 0);
  });

  const pendingSwaps = computed(() => {
    return swapRequests.value.filter((s) => s.status === 'Menunggu Approval');
  });

  const urgentSwap = computed(() => {
    return pendingSwaps.value[0] || null;
  });

  const approveSwap = (id: string) => {
    const target = swapRequests.value.find((s) => s.id === id);
    if (target) {
      target.status = 'Disetujui';
      return true;
    }
    return false;
  };

  const addSwapRequest = (newSwap: ShiftSwapRecord) => {
    swapRequests.value.unshift(newSwap);
  };

  const setTeamStatus = (id: string, status: RosterTeam['status']) => {
    const team = teams.value.find((t) => t.id === id);
    if (!team) return false;
    team.status = status;
    return true;
  };

  return {
    teams,
    activeTeams,
    activeTeam,
    totalActivePersonnel,
    swapRequests,
    pendingSwaps,
    urgentSwap,
    approveSwap,
    addSwapRequest,
    setTeamStatus,
  };
}
