# Design Alignment — Milestone 1

Referensi visual dari file FigCraft **UI BMIS**. Ini bukan target pixel-perfect; shell, token, dan auth harus mengikuti bahasa visual referensi.

## Frame Referensi

- Admin login: `figcraft://node/4294988869`
- Login error: `figcraft://node/4294988908`
- Forgot password: `figcraft://node/4294989020`
- Link sent: `figcraft://node/4294989032`
- Admin dashboard shell: `figcraft://node/4294988063`
- Employee attendance shell: `figcraft://node/197`

## Verifikasi

```bash
npm run test:e2e
npm run build
```

Screenshot hasil tes ada di `test-results/design/`:

- `login.png`
- `admin-dashboard.png`
- `employee-presensi.png`

## Checklist Manual

- [ ] Font memakai Hanken Grotesk, fallback Inter.
- [ ] Tombol primary memakai `#0058BE`.
- [ ] Sidebar tidak punya tombol logout.
- [ ] Logout ada di dropdown profil.
- [ ] Di dev, dropdown profil menampilkan `Ganti akun demo`; di build/preview production tidak boleh muncul.
- [ ] Hanya satu tombol notifikasi.
- [ ] Login punya panel brand gelap dan kartu putih.
- [ ] Halaman auth tidak menampilkan sidebar/navbar.

## Di Luar Milestone Ini

- Dashboard pegawai.
- Halaman settings `5.1a–5.1e`.
- Penyelarasan halaman presensi, cuti, roster, dan lembur.
