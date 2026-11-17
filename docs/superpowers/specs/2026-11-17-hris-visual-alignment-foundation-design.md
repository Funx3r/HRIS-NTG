# HRIS Visual Alignment Foundation — Design

**Status:** Draft untuk approval  
**Tanggal:** 2026-11-17  
**Proyek:** `C:\Users\ASUS\Concept\HRIS-NTG`  
**Referensi visual:** FigCraft UI BMIS — section `UI Pegawai` (`196`), `UI Admin` (`4294974756`)

## 1. Intent

Aplikasi HRIS sudah berjalan dan alur utamanya sesuai FigCraft. Yang paling terasa meleset adalah lapisan visual global: font, warna, header, sidebar, dan login. Tujuan milestone ini adalah menyamakan fondasi visual itu supaya perbaikan halaman berikutnya tidak dikerjakan dua kali.

FigCraft dipakai sebagai **acuan visual**, bukan target pixel-perfect. Beberapa layar desain memakai font dan gaya yang tidak konsisten, jadi nilai dari halaman `Color Palette` yang dijadikan sumber utama.

## 2. Keputusan yang Sudah Dikunci

- **FigCraft = acuan visual.** Boleh ada penyesuaian konsistensi.
- **Tombol logout tetap mengikuti web:** berada di dropdown profil pada `Navbar`, bukan dipindah ke bawah sidebar.
- Footer sidebar tetap menampilkan status akses (`Akses: Admin / HR` atau `Karyawan` + indikator `Aktif`).
- Role switch cepat di header dihapus dari tampilan utama. Di mode dev, pilihan **Ganti akun demo** ada di dropdown profil; di production, ganti role lewat logout lalu login dengan akun lain.
- Ikon notifikasi di header menjadi satu tombol, mengikuti desain.
- Font aplikasi menjadi **Hanken Grotesk** dengan fallback `Inter`, sistem sans-serif.
- Warna primer menjadi **`#0058BE`**. Warna lama `#547FFF` tidak dipakai lagi untuk token utama.
- Login memakai pola panel gelap + kartu terang seperti desain admin, tetapi tetap satu halaman login generik untuk admin dan pegawai.
- Field login tetap memakai **Username** karena autentikasi aplikasi memang berbasis username. Label tidak diubah menjadi Email/NIK.
- Scope milestone 1 hanya fondasi, shell, dan auth. Dashboard pegawai, settings, dan penyelarasan halaman per halaman masuk plan berikutnya.

## 3. Goals

- Satu sumber token warna dan tipografi untuk aplikasi.
- Shell `Sidebar` dan `Navbar` mengikuti bahasa visual FigCraft.
- Halaman login, lupa kata sandi, dan tautan terkirim mengikuti pola desain.
- Test Playwright yang menjaga perilaku shell, login, dan route publik.
- `npm run build` dan `npm run test:e2e` lolos.

## 4. Non-Goals

- Tidak mengejar pixel-perfect terhadap frame FigCraft.
- Tidak menulis ulang semua halaman menjadi komponen baru.
- Tidak mengganti 2.014 class `slate-*` di seluruh repo pada milestone ini.
- Tidak menambah backend, API, atau autentikasi nyata.
- Tidak membuat dashboard pegawai, halaman settings, atau state flow yang belum ada.
- Tidak mengubah struktur route yang sudah berjalan, kecuali menambah route auth publik.

## 5. Anti-Goals

- Jangan memindahkan logout ke sidebar.
- Jangan menaruh role switch di header atau sidebar; hanya di dropdown profil dan hanya saat dev.
- Jangan menghapus status akses di footer sidebar.
- Jangan menghapus role guard yang sudah ada.
- Jangan memakai font Hanuman dari frame navigasi; itu inkonsistensi desain.
- Jangan menambahkan gradient baru pada tombol utama.
- Jangan memaksa semua halaman lama memakai token baru sekaligus.

## 6. Constraints

- Vue 3.5, TypeScript, Vue Router 4, Tailwind CSS 3.4, Vite 8.
- Tidak ada component library UI.
- Test runner baru: Playwright, Chromium, viewport `1440×900`.
- Build command: `npm run build`.
- Font dimuat dari Google Fonts. Kalau gagal, fallback ke `Inter` dan sistem.
- Halaman yang tidak disentuh boleh tetap memakai class lama selama migrasi.
- Semua perubahan warna pada file yang disentuh harus lewat token, bukan hex baru.

## 7. Token Map

Nilai ini masuk ke `src/style.css` sebagai CSS variable, lalu dipetakan di `tailwind.config.js`.

| Token | Nilai | Peran |
|---|---|---|
| `--bmis-bg` | `#F8F9FA` | Latar halaman |
| `--bmis-surface` | `#FFFFFF` | Kartu dan panel |
| `--bmis-surface-muted` | `#F3F4F6` | Latar tabel/chip |
| `--bmis-border` | `#E2E8F0` | Garis dan pemisah |
| `--bmis-text` | `#0F172A` | Judul |
| `--bmis-body` | `#46464D` | Isi teks |
| `--bmis-muted` | `#64748B` | Label dan metadata |
| `--bmis-disabled` | `#94A3B8` | Placeholder |
| `--bmis-primary` | `#0058BE` | Tombol utama, nav aktif |
| `--bmis-primary-hover` | `#004BA3` | Hover |
| `--bmis-primary-pressed` | `#003E87` | Pressed |
| `--bmis-cyan` | `#27AFCD` | Aksen brand |
| `--bmis-teal` | `#279FAA` | Brand teal |
| `--bmis-sky` | `#0284C7` | Link dan ikon info |
| `--bmis-blue-container` | `#D8E2FF` | Latar chip biru |
| `--bmis-on-blue-container` | `#001A42` | Teks di chip biru |
| `--bmis-success` | `#10B981` | Status berhasil |
| `--bmis-success-text` | `#047857` | Teks sukses |
| `--bmis-warning` | `#F59E0B` | Peringatan |
| `--bmis-error` | `#EF4444` | Status gagal |
| `--bmis-error-text` | `#BA1A1A` | Teks error |
| `--bmis-accent` | `#FFCC00` | Sorotan/badge |

Legacy alias yang masih dipakai halaman lama: `bmis-blue`, `bmis-blue-hover`, `bmis-green`, `bmis-green-hover`, `bmis-teal`, `bmis-yellow`, `bmis-red`, `bmis-label`, `bmis-muted`. Alias ini dipetakan ke token baru selama migrasi.

## 8. Pendekatan

### A. Token-first + shell + auth — dipilih

Kunci token, perbaiki `Sidebar`/`Navbar`, lalu login. Semua layar langsung ikut berubah tanpa menyentuh satu per satu. Biaya: manfaat visual terbesar muncul di awal, tetapi halaman dalam belum berubah.

### B. Page-first pilot

Perbaiki login atau dashboard lebih dulu, lalu tarik token dan shell dari situ. Biaya: quick win terlihat cepat, tetapi halaman lain sementara makin tidak konsisten dan ada rework.

### C. Full rebuild

Tulis ulang semua halaman dengan komponen baru. Biaya: paling konsisten, tetapi risiko regresi besar dan tidak sesuai kebutuhan “acuan visual”.

Dipilih **A** karena drift terbesar ada di shell dan token, bukan di tata letak halaman. Login dipakai sebagai pilot setelah fondasi terpasang.

## 9. Test Strategy

- Playwright Chromium, `1440×900`.
- Assertion berbasis perilaku dan computed style: font, background, warna nav aktif, jumlah bell, label sidebar, redirect role, dan route publik.
- Screenshot artifact untuk review manual, bukan pixel-diff otomatis.
- `npm run build` wajib lolos sebelum task terakhir.
- Test tidak boleh bergantung pada data seed atau waktu nyata.

## 10. Review Focus

- Label sidebar panjang tidak boleh overflow saat font Hanken dimuat.
- User yang sudah login tidak boleh bisa membuka halaman auth publik.
- Validasi login dan redirect role harus tetap benar.
- Logout dan demo switch hanya boleh ada di dropdown profil, bukan sidebar atau header. Demo switch hanya tampil saat `import.meta.env.DEV`.
- Font fallback harus tetap menghasilkan layout yang terbaca kalau Google Fonts gagal.

## 11. Yang Diserahkan ke Builder

- Urutan task, nama file, signature test, dan commit ada di plan.
- Detail markup per komponen ada di plan; builder boleh merapikan class selama token dan perilaku tetap.
- Halaman di luar milestone ini tidak disentuh.
