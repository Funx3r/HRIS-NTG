import { ref } from 'vue';
import type { KomponenGaji } from '../types/payroll';
import { komponenRepository } from '../services/payrollRepositories';

const items = ref<KomponenGaji[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let initialized = false;

export function useKomponenGajiStore() {
  const load = async (force = false) => {
    if (initialized && !force) return;
    loading.value = true;
    error.value = null;
    try {
      items.value = await komponenRepository.list();
      initialized = true;
    } catch (e: any) {
      error.value = e.message || 'Gagal memuat data komponen gaji';
    } finally {
      loading.value = false;
    }
  };

  const create = async (input: KomponenGaji) => {
    const created = await komponenRepository.create(input);
    items.value.push(created);
    return created;
  };

  const update = async (kode: string, patch: Partial<KomponenGaji>) => {
    const updated = await komponenRepository.update(kode, patch);
    const idx = items.value.findIndex((i) => i.kode.toLowerCase() === kode.toLowerCase());
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  };

  const deactivate = async (kode: string) => {
    return update(kode, { status: 'Nonaktif' });
  };

  const isKodeTaken = (kode: string, exceptKode?: string) => {
    const target = kode.trim().toLowerCase();
    const except = exceptKode?.trim().toLowerCase();
    return items.value.some((i) => {
      const k = i.kode.trim().toLowerCase();
      if (except && k === except) return false;
      return k === target;
    });
  };

  return {
    items,
    loading,
    error,
    load,
    create,
    update,
    deactivate,
    isKodeTaken,
  };
}
