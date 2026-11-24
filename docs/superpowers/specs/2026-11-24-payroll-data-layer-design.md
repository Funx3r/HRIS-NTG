# Payroll Data Layer + Form Master Data — Design

**Status:** Draft untuk approval
**Tanggal:** 2026-11-24
**Proyek:** `C:\Users\ASUS\Concept\HRIS-NTG` (worktree `hris-visual-foundation`)
**Referensi visual:** FigCraft UI BMIS, section `UI Payroll` (`4294989311`)

## 1. Intent

Tiga halaman payroll yang sudah ada — Komponen Gaji, Grade Pegawai, Eselon / Level Jabatan — masih berupa tampilan baca-saja. Tombol `+ Tambah` membuka stub, tombol aksi baris tidak melakukan apa pun, dan data hilang saat refresh. Aplikasi ini akan dipakai sehari-hari dan frontend-nya akan diserahkan ke backend, jadi yang dibutuhkan bukan animasi, melainkan **aksi nyata di atas lapisan data yang bisa ditukar**.

Milestone ini membangun fondasi data itu dan membuktikannya pada tiga entitas payroll sekaligus, supaya ketiga tabel langsung seragam.

## 2. Keputusan yang Sudah Dikunci

- **Pakai pendekatan repository + store async**, bukan store per entitas yang mengakses localStorage langsung, dan bukan Pinia.
- Pola ini **dipakai untuk semua modul**, tetapi **dicicil per slice**; modul kehadiran, cuti, lembur, roster, dan tukar shift menyusul dengan slice refactor-only.
- **Payroll dikerjakan lebih dulu.** Payroll paling murah untuk menguji pola: tiga halaman, data kecil, tanpa logika bisnis.
- **Slice pertama mencakup ketiga entitas** — Komponen Gaji, Grade Pegawai, Eselon — supaya tombol aksi dan form langsung seragam.
- Tombol tiga titik diganti **dua tombol terpisah**: pensil untuk ubah, trash untuk nonaktifkan.
- Trash **tidak menghapus baris**; statusnya menjadi `Nonaktif` (soft delete). Hard delete tidak diekspos di UI.
- Form dibuat sebagai **halaman penuh**, mengikuti FigCraft, bukan modal.
- Frontend-only, data dummy, localStorage; tanpa dependency baru.

## 3. Goals

- Repository async dengan `list/get/create/update` yang hari ini berbasis localStorage dan nanti bisa diganti adapter HTTP tanpa mengubah halaman.
- Tiga store payroll yang memuat data dari repository dan menyimpan `loading`/`error`.
- Enam halaman form: Tambah dan Ubah untuk Komponen, Grade, Eselon.
- Validasi nyata: field wajib, kode unik, urutan unik, panjang maksimum.
- Tombol pensil dan trash di ketiga tabel; trash memakai dialog konfirmasi dan menonaktifkan baris.
- Data bertahan setelah refresh dan langsung terlihat di tabel tanpa reload.
- Umpan balik: toast setelah simpan/nonaktif, dialog konfirmasi, baris error loading.
- Test Playwright untuk alur tambah, ubah, nonaktif, validasi, dan guard route.
- `npm run build` dan seluruh test e2e tetap hijau.

## 4. Non-Goals

- Backend, API, autentikasi nyata, atau sinkronisasi lintas perangkat.
- Migrasi modul kehadiran/cuti/lembur/roster/tukar shift pada slice ini.
- Halaman payroll yang belum ada: Eselon per Kantor, Nominal Komponen per Eselon, Gaji Pokok per Grade, Setup BPJS.
- Rantai dependensi antarhalaman (dropdown Eselon di Eselon per Kantor, dan seterusnya).
- Guard perubahan belum tersimpan saat meninggalkan form.
- Sinkronisasi lintas tab untuk data payroll.
- Hard delete, restore, audit trail, atau unduh CSV.
- Redesign halaman daftar; yang berubah hanya sumber data, filter status, dan kolom aksi.

## 5. Anti-Goals

- Jangan mempertahankan seed data di dalam komponen setelah store dipasang; seed hanya boleh ada di satu tempat.
- Jangan menambah Pinia, axios, atau library state/data baru.
- Jangan memakai `alert()` untuk konfirmasi atau umpan balik.
- Jangan membuat dua pola data berbeda di dalam modul payroll.
- Jangan mengubah perilaku modul di luar payroll pada slice ini.
- Jangan menaruh status `Nonaktif` hanya di localStorage tanpa terlihat di UI.

## 6. Constraints

- Vue 3 `<script setup lang="ts">`, Vue Router 4, Tailwind 3.4, Lucide, Playwright. Tidak ada unit-test runner; verifikasi lewat e2e + build.
- Token BMIS: primary `#0058BE`, hover `#004ba3`, heading `#171C1F`, card `bg-white rounded-2xl border border-slate-200 shadow-xs`.
- Font global Hanken Grotesk; jangan menambah import font.
- Semua route payroll memakai `meta.requiresAdmin: true`; employee diarahkan ke `/presensi/user`.
- Breadcrumb dirender di dalam halaman (`nav[aria-label="Breadcrumb Halaman"]`), bukan di Navbar.
- `perPage = 10`.
- FigCraft `Komponen Gaji` **tidak punya frame form**. Form Komponen dirancang dari kolom tabelnya, mengikuti bahasa visual form Grade/Eselon.
- Kode Eselon maksimum 10 karakter (helper FigCraft). Grade dan Komponen maksimum 20 karakter karena seed yang ada sudah lebih dari 10 (`GRADE-KONTRAK` 13, `BPJS_KES_PRS` 12).
- FigCraft Grade memakai `1 = Terendah`; Eselon memakai `1 = Paling Tinggi`. Keduanya ditampilkan urut menaik.

## 7. Pendekatan yang Dipertimbangkan

1. **Store per entitas, akses localStorage langsung** — cepat dan sesuai `useRosterStore`, tetapi CRUD terduplikasi dan setiap store harus diedit saat backend datang.
2. **Repository async + store per entitas** — satu kontrak data, adapter localStorage hari ini, adapter HTTP nanti. Halaman tidak tahu sumber data. **Dipilih.**
3. **Pinia + API client** — standar Vue, tetapi dependency baru dan memaksa migrasi pola modul lain. Ditolak karena berlebihan untuk kebutuhan sekarang.

Konsekuensi yang diterima: payroll punya lapisan data berbeda dari modul lama sampai modul itu dimigrasikan. Ini disengaja dan dicicil, bukan dibiarkan permanen.

## 8. Arsitektur Data

### 8.1 Tipe

Buat `src/types/payroll.ts`:

```ts
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
```

`kode` adalah natural key. Tidak ada field `id` terpisah.

### 8.2 Repository

`src/services/repository.ts`:

```ts
export interface Repository<T> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
}
```

Catatan:
- Semua method async sejak awal, walau adapter lokal menyelesaikan segera. Halaman sudah siap menerima latency backend.
- Tidak ada `remove`; soft delete adalah `update(id, { status: 'Nonaktif' })` di store, bukan operasi repository.
- Error membawa `code`: `DUPLICATE`, `NOT_FOUND`, `CORRUPT`.
- `create` menolak kode duplikat; `update` menolak kode yang tidak ada.
- Nilai yang dikembalikan adalah salinan, bukan referensi ke array internal.

### 8.3 Adapter localStorage

`createLocalRepository<T>({ key, seed, idOf })`:

- Baca key saat pertama dipakai; kalau belum ada, tulis salinan seed.
- JSON rusak → lempar error `CORRUPT`; **jangan menimpa** data pengguna.
- Tulis dilakukan setelah create/update berhasil.
- Tidak ada delay buatan.
- Key memakai pola yang sudah ada: `bmis_shared_payroll_komponen_v1`, `bmis_shared_payroll_grade_v1`, `bmis_shared_payroll_eselon_v1`.

### 8.4 Seed

`src/data/payrollSeed.ts` memuat 5 baris per entitas, disalin persis dari halaman yang sekarang. Seed Komponen mendapat `status: 'Aktif'`.

### 8.5 Store

Tiga file, satu per entitas: `useKomponenGajiStore.ts`, `useGradePegawaiStore.ts`, `useEselonStore.ts`.

Bentuk tiap store:

- `items: Ref<T[]>`, `loading: Ref<boolean>`, `error: Ref<string | null>`
- `load(force = false)` — idempoten; tidak fetch ulang kalau sudah sukses, kecuali `force`.
- `create(input)`, `update(kode, patch)`, `deactivate(kode)`
- `isKodeTaken(kode, exceptKode?)`, `isUrutanTaken(urutan, exceptKode?)` untuk Grade/Eselon.
- Setelah create/update, `items` diperbarui di memori dan tabel langsung berubah.

Tidak memakai factory store pada slice ini. Tiga store tipis lebih mudah dibaca daripada satu abstraksi generik yang harus menampung aturan berbeda. Repository tetap satu-satunya tempat persistensi.

## 9. Halaman Daftar

### 9.1 Sumber data

Ketiga halaman berhenti memakai `const rawItems` dan membaca store. `filteredList` tetap computed; tambahkan pengurutan:

- Grade: `urutan` menaik.
- Eselon: `urutan` menaik.
- Komponen: urutan seed/insertion (baris baru di akhir).

Badge card header memakai **total baris** (`items.length`), bukan hasil filter. Counter `Menampilkan X dari Y entri` tetap memakai hasil filter.

### 9.2 Aksi baris

Ganti tombol tiga titik dengan:

- **Pensil** — `aria-label="Ubah <nama entitas> <kode>"`, navigasi ke halaman ubah. Ukuran ikon 15, target klik minimal 28×28, hover `text-slate-600 bg-slate-100`.
- **Trash** — `aria-label="Nonaktifkan <nama entitas> <kode>"`, membuka dialog konfirmasi. Warna hover `text-rose-600 bg-rose-50`.
- Baris yang sudah `Nonaktif`: trash `disabled` dengan `title="Sudah nonaktif"`; pensil tetap aktif untuk reaktivasi lewat form.
- Kolom `AKSI` diberi lebar minimum agar dua ikon tidak berdesakan.

Tidak ada menu dropdown lagi.

### 9.3 Filter status dan kolom status

- Ketiga tabel mendapat filter status dengan default **Semua Status**.
- Komponen mendapat kolom `STATUS` baru (sebelum `AKSI`) agar soft delete terlihat. Grade dan Eselon sudah punya.
- Eselon mempertahankan filter kategori; Komponen mempertahankan filter tipe; Grade hanya filter status.
- Filter status + filter lain + search digabung dengan AND.
- Baris `Nonaktif` tetap tampil dengan badge abu-abu yang sudah ada.

Catatan layout: Komponen menjadi 8 kolom. Di 1280×800 tabel boleh horizontal-scroll; teks sel `Kena Pajak` boleh dipersingkat menjadi `Ya` / `Tidak` dengan `title` lengkap kalau diperlukan.

### 9.4 Loading, kosong, error

- Saat `loading`: satu baris tabel `Memuat data...` dengan `colspan` sesuai jumlah kolom.
- Saat `error`: satu baris berisi pesan dan tombol `Coba lagi` yang memanggil `load(true)`.
- Saat hasil filter kosong: pesan kosong yang sudah ada.
- Empty state tidak boleh dianggap sebagai data kosong saat store masih loading.

## 10. Halaman Form

### 10.1 Route

| Route | Name | Form |
|---|---|---|
| `/payroll/komponen/tambah` | `KomponenGajiTambah` | Tambah Komponen |
| `/payroll/komponen/:kode/ubah` | `KomponenGajiUbah` | Ubah Komponen |
| `/payroll/grade/tambah` | `GradePegawaiTambah` | Tambah Grade |
| `/payroll/grade/:kode/ubah` | `GradePegawaiUbah` | Ubah Grade |
| `/payroll/eselon/tambah` | `EselonJabatanTambah` | Tambah Eselon |
| `/payroll/eselon/:kode/ubah` | `EselonJabatanUbah` | Ubah Eselon |

Semua memakai `meta: { requiresAdmin: true, breadcrumbParent: 'Payroll', breadcrumb: '<judul form>' }`.

Kode tidak ada di store saat membuka halaman ubah → redirect ke halaman daftar + toast error `Data tidak ditemukan.`.

### 10.2 Tata letak

Mengikuti FigCraft:

- Breadcrumb in-page: `Payroll > <Entitas> > Tambah|Ubah`; item entitas bisa diklik.
- Link `Kembali ke <Entitas>` di atas judul.
- Judul form + subjudul + pill `Draft Mode` / `Mode Edit` di kanan.
- Satu card: header card (ikon, judul `Form Informasi ...`, subjudul, `ID Draft: Otomatis` atau `ID: <kode>`), garis pemisah, grid field 2 kolom di desktop dan 1 kolom di mobile, callout informasi, lalu footer aksi.
- Footer: catatan di kiri, `Batal` (link kembali ke daftar) dan tombol simpan di kanan.
- Tombol simpan: `Simpan Komponen`, `Simpan` (Grade, mengikuti FigCraft), `Simpan Eselon`; mode ubah memakai `Simpan Perubahan`.

Komponen presentasi bersama:

- `PayrollFormShell.vue` — chrome halaman form (breadcrumb, judul, card, footer); field diisi lewat slot.
- `FormField.vue` — label, tanda wajib, helper, pesan error, `aria-describedby`; input/select di dalam slot.
- `StatusSwitch.vue` — `role="switch"`, `aria-checked`, label dan deskripsi.
- `ConfirmDialog.vue` — dipakai tiga halaman daftar.
- `ToastViewport.vue` + `useToast.ts` — dipasang sekali di `App.vue`.

Ekstraksi ini dibatasi pada elemen yang benar-benar dipakai berulang; jangan membuat sistem komponen baru.

### 10.3 Field dan validasi

**Komponen Gaji** (tidak ada frame FigCraft; dirancang dari tabel):

| Field | Aturan |
|---|---|
| Kode | wajib, 2–20 karakter, huruf besar/angka/`_`/`-`, unik |
| Nama | wajib, 3–60 karakter |
| Tipe | wajib: Penghasilan / Beban Perusahaan / Potongan |
| Sifat | wajib: Tetap / Sementara |
| Metode Hitung | wajib: Nominal Tetap / Persentase / Per Hari / Input |
| Kena Pajak | boolean, default mati |
| Status Aktif | boolean, default aktif |

**Grade Pegawai**:

| Field | Aturan |
|---|---|
| Kode | wajib, 2–20 karakter, huruf besar/angka/`_`/`-`, unik |
| Urutan | wajib, bilangan bulat ≥ 1, unik |
| Nama | wajib, 3–60 karakter |
| Golongan ASN | opsional, maks. 20 karakter, placeholder `Contoh: III/a` |
| Status Aktif | boolean, default aktif |

**Eselon / Level Jabatan**:

| Field | Aturan |
|---|---|
| Kode | wajib, 2–10 karakter, huruf besar/angka/`_`/`-`, unik |
| Urutan | wajib, bilangan bulat ≥ 1, unik |
| Nama | wajib, 3–60 karakter |
| Kategori | wajib: Struktural / Fungsional / Non-Eselon |
| Status Aktif | boolean, default aktif |

Aturan tambahan:

- Kode di-`trim`, diubah ke huruf besar, dan divalidasi dengan `/^[A-Z0-9_-]+$/`.
- Perbandingan kode unik tidak peka huruf besar/kecil.
- Saat ubah, **kode ditampilkan disabled** dan tidak bisa diubah; helper: `Kode tidak dapat diubah setelah dibuat.` Alasan: kode adalah referensi halaman lain dan natural key backend.
- Validasi urutan unik mengecualikan baris yang sedang diubah.
- Error tampil di bawah field masing-masing, field pertama yang gagal difokuskan saat submit.
- Tombol simpan tidak dinonaktifkan permanen; validasi terjadi saat submit supaya pengguna tahu apa yang salah.

### 10.4 Simpan

1. Validasi; kalau gagal, berhenti.
2. `create` atau `update` lewat store.
3. Toast sukses: `<KODE> berhasil ditambahkan.` / `<KODE> berhasil diperbarui.`
4. `router.push` ke halaman daftar entitas.
5. Error repository (`DUPLICATE`, `CORRUPT`) ditampilkan sebagai toast error; form tidak ditutup agar input tidak hilang.

### 10.5 Batal dan guard

`Batal` kembali ke daftar tanpa menyimpan. Guard perubahan belum tersimpan **ditunda**; belum ada konfirmasi saat menutup tab atau menekan back.

## 11. Nonaktifkan (Soft Delete)

- Trash membuka `ConfirmDialog`:
  - Judul: `Nonaktifkan <Entitas>?`
  - Isi: `<KODE> tidak akan muncul di pilihan halaman lain. Data dan riwayatnya tetap tersimpan.`
  - Tombol: `Batal` dan `Nonaktifkan` (rose).
- Konfirmasi → `store.deactivate(kode)` → toast `<KODE> dinonaktifkan.`
- Baris tetap di tabel dengan badge `Nonaktif`; filter default `Semua Status` membuat perubahan langsung terlihat.
- Reaktivasi lewat form Ubah dan toggle Status Aktif.
- Dialog: `role="alertdialog"`, `aria-modal`, fokus awal ke `Batal`, ESC dan klik backdrop menutup.

## 12. Umpan Balik

- `useToast` menyimpan array module-level; `pushToast(type, message)`; otomatis hilang setelah 4 detik; bisa ditutup manual.
- `ToastViewport` dirender di `App.vue` untuk layout auth maupun utama, `aria-live="polite"`, posisi kanan atas, di atas konten.
- Tidak ada load spinner global; loading hanya di area tabel dan tombol simpan (teks `Menyimpan...` + disabled saat proses).

## 13. Sidebar dan Guard

- `isPayrollOpen` tetap default terbuka.
- Active state sub-menu payroll memakai `isSubActive('/payroll/<entitas>')` supaya halaman form tetap menyorot entitas induknya.
- Employee yang membuka route form tetap diarahkan ke `/presensi/user`.

## 14. Pengujian

Update test lama:

- `payroll-eselon.spec.ts`: test stub modal diganti test navigasi ke form Tambah.
- Test hitungan awal tetap 5 setelah storage bersih.
- Tambah test active state sub-menu saat berada di halaman form.

Test baru minimal:

1. **Tambah Eselon**: isi Kode/Urutan/Nama/Kategori → simpan → kembali ke daftar → baris baru tampil → reload → masih tampil.
2. **Validasi**: submit kosong menampilkan error wajib; kode duplikat ditolak; kode > 10 karakter ditolak; urutan duplikat ditolak.
3. **Ubah**: pensil membuka form terisi; kode disabled; ubah nama → simpan → tabel berubah.
4. **Nonaktif**: trash → dialog → konfirmasi → badge jadi Nonaktif dan baris tetap ada; filter `Nonaktif` menampilkannya; reaktivasi lewat form mengembalikan ke Aktif.
5. **Komponen dan Grade**: satu alur tambah + satu alur nonaktif per entitas (tidak perlu mengulang semua variasi validasi).
6. **Guard**: employee tidak bisa membuka `/payroll/eselon/tambah` dan diarahkan ke `/presensi/user`.
7. **Kode tidak ditemukan**: `/payroll/grade/TIDAK-ADA/ubah` redirect ke daftar.

Test harus mulai dari storage bersih (context Playwright baru sudah bersih; untuk test persistensi reload, gunakan halaman yang sama).

## 15. Urutan Slice

1. **Slice 1 (dokumen ini):** fondasi repository + tiga store + enam form + aksi pensil/trash + toast/dialog + test.
2. **Slice 2:** halaman payroll yang belum ada (Eselon per Kantor, Nominal Komponen per Eselon, Gaji Pokok per Grade, Setup BPJS), memakai repository dan form yang sama; masing-masing punya plan sendiri.
3. **Slice 3+:** migrasi modul lama satu per satu ke repository, **refactor-only**: UI dan perilaku tidak berubah, test lama wajib tetap hijau. Urutan: absensi, cuti, lembur, roster, tukar shift.

## 16. File Map

Baru:

- `src/types/payroll.ts`
- `src/data/payrollSeed.ts`
- `src/services/repository.ts`
- `src/services/payrollRepositories.ts`
- `src/services/payrollValidation.ts`
- `src/composables/useKomponenGajiStore.ts`
- `src/composables/useGradePegawaiStore.ts`
- `src/composables/useEselonStore.ts`
- `src/composables/useToast.ts`
- `src/components/payroll/PayrollFormShell.vue`
- `src/components/payroll/FormField.vue`
- `src/components/payroll/StatusSwitch.vue`
- `src/components/payroll/ConfirmDialog.vue`
- `src/components/payroll/ToastViewport.vue`
- `src/pages/payroll/KomponenGajiForm.vue`
- `src/pages/payroll/GradePegawaiForm.vue`
- `src/pages/payroll/EselonJabatanForm.vue`
- `tests/e2e/payroll-crud.spec.ts`

Diubah:

- `src/pages/payroll/KomponenGaji.vue`, `GradePegawai.vue`, `EselonJabatan.vue`
- `src/router/index.ts`
- `src/components/layout/Sidebar.vue`
- `src/App.vue`
- `tests/e2e/payroll-eselon.spec.ts`, `payroll-navigation.spec.ts`

Satu komponen form dipakai untuk tambah dan ubah; mode ditentukan dari route (`tambah` vs `:kode/ubah`), bukan dua file terpisah.

## 17. Keputusan yang Saya Ambil

Hal-hal berikut tidak diputuskan eksplisit oleh pemilik produk; saya memilihnya dan bisa dikoreksi:

- Form sebagai halaman penuh, bukan modal, mengikuti FigCraft.
- Kode tidak dapat diubah saat mode ubah.
- Kolom `STATUS` ditambahkan ke tabel Komponen karena FigCraft belum punya dan soft delete butuh tampilan status.
- Filter status ditambahkan ke Komponen dan Eselon; default `Semua Status`.
- Form Komponen dirancang dari kolom tabel karena tidak ada frame FigCraft.
- Golongan ASN memakai input teks bebas, bukan select, agar `III/a`, `III/b`, dan `-` tetap bisa diisi.
- Toast ringan ditambahkan sebagai umpan balik global.
- Urutan Grade dan Eselon ditampilkan menaik meski arti `1` berbeda.
- Keunikan `kode` dan `urutan` berlaku untuk semua data termasuk yang berstatus `Nonaktif`, agar tidak terjadi konflik jika baris nonaktif diaktifkan kembali.
- Tombol `Batal` pada form melakukan navigasi langsung (`router.push`) kembali ke halaman daftar entitas terkait, bukan `history.back()`, agar aman saat halaman dibuka via URL langsung.

## 18. Yang Diserahkan ke Builder

- Nama komponen kecil dan pembagian slot, selama tidak menambah lapisan abstraksi yang tidak perlu.
- Kata-kata pesan validasi dan toast.
- Detail fokus/scroll saat validasi gagal.
- Apakah `PayrollFormShell` menangani tombol simpan yang sedang proses atau tiap halaman.
- Pengorganisasian test dan pemilihan selector yang stabil.
- Penyesuaian kecil lebar kolom Komponen agar tetap nyaman di 1280×800.
