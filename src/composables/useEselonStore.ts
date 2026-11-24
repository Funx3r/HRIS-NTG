import { ref } from 'vue';
import type { EselonJabatan } from '../types/payroll';
import { eselonRepository } from '../services/payrollRepositories';

const items = ref<EselonJabatan[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let initialized = false;

export function useEselonStore() {
  const load = async (force = false) => {
    if (initialized && !force) return;
    loading.value = true;
    error.value = null;
    try {
      const res = await eselonRepository.list();
      items.value = res.sort((a, b) => a.urutan - b.urutan);
      initialized = true;
    } catch (e: any) {
      error.value = e.message || 'Gagal memuat data eselon jabatan';
    } finally {
      loading.value = false;
    }
  };

  const create = async (input: EselonJabatan) => {
    const created = await eselonRepository.create(input);
    items.value.push(created);
    items.value.sort((a, b) => a.urutan - b.urutan);
    return created;
  };

  const update = async (kode: string, patch: Partial<EselonJabatan>) => {
    const updated = await eselonRepository.update(kode, patch);
    const idx = items.value.findIndex((i) => i.kode.toLowerCase() === kode.toLowerCase());
    if (idx !== -1) items.value[idx] = updated;
    items.value.sort((a, b) => a.urutan - b.urutan);
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

  const isUrutanTaken = (urutan: number, exceptKode?: string) => {
    const except = exceptKode?.trim().toLowerCase();
    return items.value.some((i) => {
      if (except && i.kode.trim().toLowerCase() === except) return false;
      return Number(i.urutan) === Number(urutan);
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
    isUrutanTaken,
  };
}
