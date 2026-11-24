import type { KomponenGaji, GradePegawai, EselonJabatan } from '../types/payroll';

export const defaultKomponenGajiSeed: KomponenGaji[] = [
  {
    kode: 'GAJPOK',
    nama: 'Gaji Pokok',
    tipe: 'Penghasilan',
    sifat: 'Tetap',
    metode: 'Nominal Tetap',
    kenaPajak: true,
    status: 'Aktif',
  },
  {
    kode: 'TJ_JABATAN',
    nama: 'Tunjangan Jabatan',
    tipe: 'Penghasilan',
    sifat: 'Tetap',
    metode: 'Nominal Tetap',
    kenaPajak: true,
    status: 'Aktif',
  },
  {
    kode: 'UANG_MAKAN',
    nama: 'Uang Makan',
    tipe: 'Penghasilan',
    sifat: 'Sementara',
    metode: 'Per Hari',
    kenaPajak: false,
    status: 'Aktif',
  },
  {
    kode: 'BPJS_KES_PRS',
    nama: 'Iuran BPJS Kesehatan Perusahaan',
    tipe: 'Beban Perusahaan',
    sifat: 'Tetap',
    metode: 'Persentase',
    kenaPajak: false,
    status: 'Aktif',
  },
  {
    kode: 'KASBON',
    nama: 'Kasbon',
    tipe: 'Potongan',
    sifat: 'Sementara',
    metode: 'Input',
    kenaPajak: false,
    status: 'Aktif',
  },
];

export const defaultGradePegawaiSeed: GradePegawai[] = [
  {
    kode: 'GRADE-1',
    nama: 'Pelaksana Pemula',
    urutan: 1,
    golonganAsn: 'I/a',
    status: 'Aktif',
  },
  {
    kode: 'GRADE-2',
    nama: 'Pelaksana Terampil',
    urutan: 2,
    golonganAsn: 'II/a',
    status: 'Aktif',
  },
  {
    kode: 'GRADE-3',
    nama: 'Pelaksana Mahir',
    urutan: 3,
    golonganAsn: 'III/a',
    status: 'Aktif',
  },
  {
    kode: 'GRADE-4',
    nama: 'Ahli Madya',
    urutan: 4,
    golonganAsn: 'IV/a',
    status: 'Aktif',
  },
  {
    kode: 'GRADE-KONTRAK',
    nama: 'Tenaga Kontrak Lapangan',
    urutan: 5,
    golonganAsn: '-',
    status: 'Nonaktif',
  },
];

export const defaultEselonJabatanSeed: EselonJabatan[] = [
  {
    kode: 'ESELON-I',
    nama: 'Direktur Utama / Pimpinan Tinggi',
    urutan: 1,
    kategori: 'Struktural',
    status: 'Aktif',
  },
  {
    kode: 'ESELON-II',
    nama: 'Kepala Divisi / Senior VP',
    urutan: 2,
    kategori: 'Struktural',
    status: 'Aktif',
  },
  {
    kode: 'ESELON-III',
    nama: 'Kepala Bagian / Manajer',
    urutan: 3,
    kategori: 'Struktural',
    status: 'Aktif',
  },
  {
    kode: 'FUNG-AHLI',
    nama: 'Tenaga Ahli Utama',
    urutan: 4,
    kategori: 'Fungsional',
    status: 'Aktif',
  },
  {
    kode: 'NON-ESELON',
    nama: 'Staf Operasional Lapangan',
    urutan: 5,
    kategori: 'Non-Eselon',
    status: 'Aktif',
  },
];
