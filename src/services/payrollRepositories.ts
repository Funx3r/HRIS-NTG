import { createLocalRepository } from './repository';
import type { KomponenGaji, GradePegawai, EselonJabatan } from '../types/payroll';
import {
  defaultKomponenGajiSeed,
  defaultGradePegawaiSeed,
  defaultEselonJabatanSeed,
} from '../data/payrollSeed';

export const komponenRepository = createLocalRepository<KomponenGaji>({
  key: 'bmis_shared_payroll_komponen_v1',
  seed: defaultKomponenGajiSeed,
  idOf: (item) => item.kode,
});

export const gradeRepository = createLocalRepository<GradePegawai>({
  key: 'bmis_shared_payroll_grade_v1',
  seed: defaultGradePegawaiSeed,
  idOf: (item) => item.kode,
});

export const eselonRepository = createLocalRepository<EselonJabatan>({
  key: 'bmis_shared_payroll_eselon_v1',
  seed: defaultEselonJabatanSeed,
  idOf: (item) => item.kode,
});
