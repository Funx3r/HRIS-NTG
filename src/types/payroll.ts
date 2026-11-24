export type PayrollStatus = 'Aktif' | 'Nonaktif';

export interface KomponenGaji {
  kode: string;
  nama: string;
  tipe: 'Penghasilan' | 'Beban Perusahaan' | 'Potongan';
  sifat: 'Tetap' | 'Sementara';
  metode: 'Nominal Tetap' | 'Persentase' | 'Per Hari' | 'Input';
  kenaPajak: boolean;
  status: PayrollStatus;
}

export interface GradePegawai {
  kode: string;
  nama: string;
  urutan: number;
  golonganAsn: string;
  status: PayrollStatus;
}

export interface EselonJabatan {
  kode: string;
  nama: string;
  urutan: number;
  kategori: 'Struktural' | 'Fungsional' | 'Non-Eselon';
  status: PayrollStatus;
}
