# Selaras Visual Frame Payroll (FigCraft) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyelaraskan 27 frame Payroll di section FigCraft `UI Payroll` (`4294989311`) ke bahasa visual BMIS — font Hanken Grotesk, palet token `src/style.css`, status akses di footer sidebar, dan nav aktif biru.

**Architecture:** Tidak ada kode aplikasi yang diubah. Seluruh pekerjaan adalah operasi node lewat MCP `figcraft-app` pada dokumen "UI BMIS". Setiap task mengumpulkan node lewat `get_node`, lalu menerapkan perubahan sebagai **satu** `batch` (= satu langkah undo). Sebuah fungsi audit yang sama dipakai sebelum dan sesudah untuk membuktikan hasilnya.

**Tech Stack:** FigCraft MCP via tool `execute` (Code Mode), `get_node`, `fill.set` / `stroke.set` / `node.set` di dalam `batch`, `screenshot` untuk review visual, `file.saveVersion` untuk backup.

**Spec:** `docs/superpowers/specs/2026-11-17-hris-visual-alignment-foundation-design.md` (token, aturan shell, anti-goal) + keputusan brainstorming 2026-11-18: pendekatan **B** — frame diselaraskan ke gaya app, FigCraft tetap acuan visual, bukan target pixel-perfect.

## Global Constraints

- Nilai warna dan font diambil dari `src/style.css` (`--bmis-*`), bukan hex baru.
- FigCraft = acuan visual. Jangan mengejar pixel-perfect; jangan mengubah teks isi/data tabel.
- Logout **tidak boleh** ada di sidebar. Footer sidebar wajib menampilkan status akses (`Akses: Admin / HR` + `Aktif`) — spec §2 dan §5.
- Hanya warna, font, dan shell yang berubah. Struktur tabel, jumlah kolom, dan isi baris tetap.
- 1 task = 1 `batch` = 1 undo step. Kalau satu step gagal, `batch` rollback total.
- 27 frame yang disentuh: id `4294989324` … `4294996919` (daftar lengkap di Task 2). Enam label bar `4294989312`–`4294989322` hanya diubah warna latarnya di Task 4.
- Task 1–6 tidak menghasilkan perubahan file repo. Commit hanya di Task 7.
- Dokumen FigCraft belum punya path di disk (`dirty: true`). Backup hanya lewat version history; kalau app ditutup sebelum `file.save`, versi itu ikut hilang.

## Review Focus

- **Font swap menggeser teks.** 1.845 text layer pindah dari Plus Jakarta Sans ke Hanken Grotesk; mayoritas berada di auto layout. Label 11px bisa wrap atau terpotong. Setiap task yang mengubah font wajib diakhiri screenshot dua halaman.
- **27 node punya dua lapis fill.** `node.set { fill }` menghapus lapis kedua. Semua perubahan warna wajib lewat `fill.set` per `index`.
- **Satu hex, dua peran.** `#C4C7C7` dipakai sebagai fill (bullet/ikon) dan stroke (border). Fill → `#94A3B8`, stroke → `#E2E8F0`. `#86F2E4` juga: fill → `#ECFDF5`, stroke → `#BBF7D0`.
- **Sidebar Setup BPJS punya grup nav duplikat** (dua blok SETUP, satu berjudul PAYROLL BULANAN tapi isinya item SETUP). Task 3 merapikannya; tinggi sidebar berubah.
- **Footer sidebar dikosongkan sebagian** (avatar dan tombol logout disembunyikan). Kalau footer jadi mengambang di tengah, container nav harus diberi `sizingV: fill`.

---

### Task 1: Backup dan audit baseline

**Files:** tidak ada.

**Interfaces:**
- Produces: angka baseline `textsOffFont = 1845`, `paintSlotsOffPalette = 3475`, dipakai sebagai pembanding di Task 2 dan Task 6.

- [ ] **Step 1: Simpan backup ke version history**

```js
return await tools["figcraft-app"].run_command({
  command: "file.saveVersion",
  params: { name: "Sebelum selaras BMIS", description: "Backup sebelum restyle 27 frame Payroll" },
});
```

Expected: objek version dengan `id` dan `name: "Sebelum selaras BMIS"`.

- [ ] **Step 2: Jalankan audit — pastikan FAIL**

```js
const F = "figcraft-app";
const FRAMES = [4294989324,4294989620,4294989912,4294990185,4294990458,4294990751,4294991014,4294991261,4294991556,4294991812,4294992078,4294992387,4294992710,4294993043,4294993361,4294993680,4294993986,4294994274,4294994562,4294994849,4294995172,4294995495,4294995730,4294995965,4294996284,4294996603,4294996919];

const ALLOWED = new Set(["#0F172A","#46464D","#64748B","#94A3B8","#F8F9FA","#F3F4F6","#E2E8F0","#FFFFFF","#0058BE","#047857","#ECFDF5","#BBF7D0","#BA1A1A","#FEE2E2","#FECACA","#D8E2FF","#001A42","#F59E0B","#F8FAFC"]);

const perFrame = [];
let textsOffFont = 0, paintSlotsOffPalette = 0;
for (const id of FRAMES) {
  const root = await tools[F].get_node({ id, depth: 40, maxBytes: 20000000, fields: ["name","type","fills","strokes","fontFamily"] });
  let t = 0, p = 0;
  const walk = (n) => {
    if (n.type === "TEXT" && n.fontFamily !== "Hanken Grotesk") t++;
    for (const slot of ["fills","strokes"]) {
      for (const paint of n[slot] || []) {
        if (paint && paint.type === "solid" && !ALLOWED.has(paint.color)) p++;
      }
    }
    for (const c of n.children || []) walk(c);
  };
  walk(root);
  textsOffFont += t; paintSlotsOffPalette += p;
  perFrame.push({ id, textsOffFont: t, paintSlotsOffPalette: p });
}
return { frames: FRAMES.length, textsOffFont, paintSlotsOffPalette, perFrame };
```

Expected: `{ frames: 27, textsOffFont: 1845, paintSlotsOffPalette: 3475 }`.

Kalau angkanya berbeda, dokumen sudah berubah sejak 2026-11-18 — catat angka baru sebagai baseline dan lanjutkan.

---

### Task 2: Tipografi ke Hanken Grotesk

**Files:** tidak ada.

**Interfaces:**
- Produces: helper `readFrames()` (dipakai Task 3–6) dan jaminan `textsOffFont = 0`.

- [ ] **Step 1: Terapkan font — satu batch**

```js
const F = "figcraft-app";
const FRAMES = [4294989324,4294989620,4294989912,4294990185,4294990458,4294990751,4294991014,4294991261,4294991556,4294991812,4294992078,4294992387,4294992710,4294993043,4294993361,4294993680,4294993986,4294994274,4294994562,4294994849,4294995172,4294995495,4294995730,4294995965,4294996284,4294996603,4294996919];

async function readFrames() {
  const all = [];
  for (const id of FRAMES) {
    const root = await tools[F].get_node({
      id, depth: 40, maxBytes: 20000000,
      fields: ["name","type","fills","strokes","characters","fontFamily","fontStyle","fontSize","visible","layout","sizing","cornerRadius"],
    });
    const walk = (n, parent) => {
      all.push({ n, parent });
      for (const c of n.children || []) walk(c, n);
    };
    walk(root, null);
  }
  return all;
}

const STYLE = { "Semi Bold": "SemiBold" };
const nodes = await readFrames();
const groups = new Map();
for (const { n } of nodes) {
  if (n.type !== "TEXT" || n.fontFamily === "Hanken Grotesk") continue;
  const key = `${n.fontFamily}|${n.fontStyle}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(n.id);
}
const commands = [...groups.entries()].map(([key, ids]) => {
  const [family, style] = key.split("|");
  return { command: "node.set", params: { ids, fontFamily: "Hanken Grotesk", fontStyle: STYLE[style] || style } };
});
return { groups: commands.length, texts: commands.reduce((a, c) => a + c.params.ids.length, 0), result: await tools[F].batch({ commands, label: "Tipografi: Hanken Grotesk" }) };
```

Expected: `{ groups: 6, texts: 1845 }` — enam kombinasi: Plus Jakarta Sans Regular / Medium / Semi Bold / Bold, Liberation Mono Regular / Bold.

- [ ] **Step 2: Audit ulang — pastikan `textsOffFont = 0`**

Jalankan ulang snippet audit Task 1 Step 2.
Expected: `textsOffFont: 0`; `paintSlotsOffPalette` tidak berubah (`3475`).

- [ ] **Step 3: Screenshot dua halaman**

```js
return await tools["figcraft-app"].screenshot({ ids: [4294989324], maxSize: 1400 });
```

Ulangi untuk `4294993043` (Gaji Pokok per Grade). Yang diperiksa: label 11px uppercase tidak terpotong, header tabel tetap satu baris, tombol tidak berubah lebar.

- [ ] **Step 4: Kalau ada yang rusak**

`await tools["figcraft-app"].undo()` membatalkan seluruh Task 2 (`batch` = satu undo step), lalu perbaiki ukuran teks yang bermasalah sebelum mengulang.

---

### Task 3: Rapikan grup nav duplikat di frame Setup BPJS

**Files:** tidak ada.

**Interfaces:**
- Consumes: tidak ada.
- Produces: sidebar `4294993986` punya satu blok SETUP dan satu blok PAYROLL BULANAN berisi `Dashboard Payroll` + `Approval Payroll`.

- [ ] **Step 1: Terapkan — satu batch**

```js
const F = "figcraft-app";
return await tools[F].batch({
  label: "Setup BPJS: rapikan nav duplikat",
  commands: [
    { command: "node.set", params: { ids: [4294994056], characters: "Dashboard Payroll" } },
    { command: "node.set", params: { ids: [4294994064], characters: "Approval Payroll" } },
    { command: "node.set", params: { ids: [4294994057, 4294994065], visible: false } },
    { command: "node.set", params: { ids: [4294994067, 4294994082, 4294994089], visible: false } },
  ],
});
```

Alasan id ini: `4294994048` adalah container grup kedua (judul `PAYROLL BULANAN`), `4294994056` dan `4294994064` dua baris pertamanya, sedangkan `4294994067` (tiga Link Setup BPJS/PPh21/Rate Harian), `4294994082` (baris Data Pegawai), dan `4294994089` (Link Setup Pengambilan Data) adalah sisa duplikat SETUP.

- [ ] **Step 2: Screenshot dan periksa**

```js
return await tools["figcraft-app"].screenshot({ ids: [4294993986], maxSize: 1400 });
```

Expected: sidebar menampilkan satu blok SETUP, lalu `PAYROLL BULANAN` dengan `Dashboard Payroll` dan `Approval Payroll`. Tidak ada lagi "Mapping Gaji" dua kali.

- [ ] **Step 3: Kalau tinggi sidebar jadi aneh**

Footer harus tetap menempel di bawah. Kalau mengambang, jalankan:

```js
return await tools["figcraft-app"].run_command({ command: "node.set", params: { ids: [4294993989], sizingV: "fill" } });
```

---

### Task 4: Shell — nav aktif, footer akses, label bar

**Files:** tidak ada.

**Interfaces:**
- Consumes: `readFrames()` dari Task 2.
- Produces: untuk setiap frame, `Aside` punya footer dengan `Akses: Admin / HR` + `Aktif`, tanpa tombol logout; nav aktif berwarna `#0058BE`.

- [ ] **Step 1: Terapkan — satu batch**

```js
const F = "figcraft-app";
const FRAMES = [4294989324,4294989620,4294989912,4294990185,4294990458,4294990751,4294991014,4294991261,4294991556,4294991812,4294992078,4294992387,4294992710,4294993043,4294993361,4294993680,4294993986,4294994274,4294994562,4294994849,4294995172,4294995495,4294995730,4294995965,4294996284,4294996603,4294996919];

async function readFrames() {
  const all = [];
  for (const id of FRAMES) {
    const root = await tools[F].get_node({
      id, depth: 40, maxBytes: 20000000,
      fields: ["name","type","fills","strokes","characters","fontFamily","fontStyle","fontSize","visible","layout","sizing","cornerRadius"],
    });
    const walk = (n, parent) => {
      all.push({ n, parent });
      for (const c of n.children || []) walk(c, n);
    };
    walk(root, null);
  }
  return all;
}

const nodes = await readFrames();
const byId = new Map(nodes.map((x) => [x.n.id, x]));
const solid = (n, slot) => (n[slot] || []).find((p) => p && p.type === "solid");
const commands = [];
const skipped = [];

// 1. Nav aktif: titik 6x6 bertanda #006A61 di dalam Aside.
for (const { n, parent } of nodes) {
  if (n.name !== "Background" || n.type !== "RECTANGLE") continue;
  const paint = solid(n, "fills");
  if (!paint || paint.color !== "#006A61") continue;
  const link = parent;
  if (!link || link.type !== "FRAME") continue;
  const text = (() => {
    let found = null;
    const walk = (x) => { if (found) return; if (x.type === "TEXT") { found = x; return; } for (const c of x.children || []) walk(c); };
    walk(link);
    return found;
  })();
  commands.push({ command: "fill.set", params: { ids: [n.id], index: 0, color: "#0058BE" } });
  if (text) {
    commands.push({ command: "node.set", params: { ids: [text.id], fill: "#0058BE", fontStyle: "SemiBold", fontSize: 13 } });
  }
}

// 2. Komponen Gaji memakai pola pill, bukan titik.
//    Rantainya: Text 4294989358 > Container 4294989357 > Link 4294989355.
commands.push({ command: "node.set", params: { ids: [4294989358], fill: "#0058BE", fontStyle: "SemiBold", fontSize: 13 } });
const kgContainer = byId.get(byId.get(4294989358).parent.id);
const kgLink = kgContainer?.parent ? byId.get(kgContainer.parent.id) : null;
if (kgLink) commands.push({ command: "node.set", params: { ids: [kgLink.n.id], fill: "#D8E2FF" } });

// 3. Avatar topbar: FRAME "Background" berlatar #111111 (satu per frame, 27 total).
for (const { n } of nodes) {
  if (n.name !== "Background" || n.type !== "FRAME") continue;
  const paint = solid(n, "fills");
  if (paint && paint.color === "#111111") {
    commands.push({ command: "fill.set", params: { ids: [n.id], index: 0, color: "#0058BE" } });
  }
}

// 4. Footer sidebar: status akses, tanpa logout.
for (const { n } of nodes) {
  if (n.name !== "Aside" || n.type !== "FRAME") continue;
  const footerFrames = (n.children || []).filter((c) => c.type === "FRAME");
  const footer = footerFrames[footerFrames.length - 1];
  if (!footer) { skipped.push(n.id); continue; }
  const flat = [];
  const walk = (x, parent) => { flat.push({ x, parent }); for (const c of x.children || []) walk(c, x); };
  walk(footer, null);

  const avatar = flat.find(({ x }) => x.type === "FRAME" && x.name === "Background" && (x.children || []).some((c) => c.type === "TEXT"));
  const texts = flat.filter(({ x }) => x.type === "TEXT");
  const logout = flat.find(({ x }) => x.type === "FRAME" && x.name === "Button");
  const nameText = texts.find(({ x }) => String(x.characters || "").includes("Admin"));
  const emailText = texts.find(({ x }) => String(x.characters || "").includes("@"));

  if (!nameText || !emailText) { skipped.push(n.id); continue; }
  if (avatar) commands.push({ command: "node.set", params: { ids: [avatar.x.id], visible: false } });
  if (logout) commands.push({ command: "node.set", params: { ids: [logout.x.id], visible: false } });
  commands.push({ command: "node.set", params: { ids: [nameText.x.id], characters: "Akses: Admin / HR" } });
  commands.push({ command: "node.set", params: { ids: [emailText.x.id], characters: "Aktif", fill: "#047857", fontStyle: "SemiBold" } });
}

// 5. Enam label bar jadi biru brand.
commands.push({ command: "node.set", params: { ids: [4294989312,4294989314,4294989316,4294989318,4294989320,4294989322], fill: "#0058BE" } });

return { steps: commands.length, skipped, result: await tools[F].batch({ commands, label: "Shell: nav aktif, footer akses, label bar" }) };
```

Expected: `steps` 180–210; `skipped` kosong. Kalau `skipped` berisi id, frame itu tidak punya footer berpola `Admin HR` + email — periksa manual, jangan lanjut sebelum jelas.

- [ ] **Step 2: Screenshot dua halaman**

```js
return await tools["figcraft-app"].screenshot({ ids: [4294989620], maxSize: 1400 });
```

Ulangi untuk `4294993986`. Yang diperiksa: nav aktif biru, footer berbunyi `Akses: Admin / HR` / `Aktif`, tombol logout hilang, footer menempel di bawah.

- [ ] **Step 3: Kalau footer mengambang**

```js
return await tools["figcraft-app"].batch({
  label: "Footer sidebar menempel bawah",
  commands: [
    { command: "node.set", params: { ids: [4294989327], sizingV: "fill" } },
  ],
});
```

`4294989327` adalah anak FRAME pertama dari `Aside` di frame Komponen Gaji (wadah logo + nav). Pakai anak FRAME pertama `Aside` pada frame yang bermasalah — bukan `Aside` itu sendiri, karena `Aside` sudah `fill`.

---

### Task 5: Palet netral (teks, permukaan, garis)

**Files:** tidak ada.

**Interfaces:**
- Consumes: `readFrames()`.
- Produces: semua fill/stroke netral memakai token `--bmis-text`, `--bmis-body`, `--bmis-muted`, `--bmis-disabled`, `--bmis-bg`, `--bmis-surface-muted`, `--bmis-border`.

- [ ] **Step 1: Terapkan — satu batch**

```js
const F = "figcraft-app";
const FRAMES = [4294989324,4294989620,4294989912,4294990185,4294990458,4294990751,4294991014,4294991261,4294991556,4294991812,4294992078,4294992387,4294992710,4294993043,4294993361,4294993680,4294993986,4294994274,4294994562,4294994849,4294995172,4294995495,4294995730,4294995965,4294996284,4294996603,4294996919];

async function readFrames() {
  const all = [];
  for (const id of FRAMES) {
    const root = await tools[F].get_node({ id, depth: 40, maxBytes: 20000000, fields: ["name","type","fills","strokes"] });
    const walk = (n) => { all.push(n); for (const c of n.children || []) walk(c); };
    walk(root);
  }
  return all;
}

const FILL_MAP = {
  "#1A1C1C": "#0F172A", "#111111": "#0F172A", "#00201D": "#0F172A",
  "#444748": "#46464D", "#334155": "#46464D",
  "#525252": "#64748B", "#737373": "#64748B", "#747878": "#64748B",
  "#F4F3F3": "#F8F9FA", "#F9F9F9": "#F8F9FA",
  "#EEEEEE": "#F3F4F6", "#EDEDED": "#F3F4F6", "#F5F5F5": "#F3F4F6",
  "#C4C7C7": "#94A3B8",
  "#E2E2E2": "#E2E8F0", "#E8E8E8": "#E2E8F0", "#E5E5E5": "#E2E8F0",
};
const STROKE_MAP = {
  "#C4C7C7": "#E2E8F0", "#E2E2E2": "#E2E8F0", "#E5E5E5": "#E2E8F0",
  "#E7E7E7": "#E2E8F0", "#E5E7EB": "#E2E8F0",
};

const nodes = await readFrames();
const group = (slot, map) => {
  const g = new Map();
  for (const n of nodes) {
    (n[slot] || []).forEach((p, index) => {
      if (!p || p.type !== "solid" || !map[p.color]) return;
      const key = `${index}|${p.color}`;
      if (!g.has(key)) g.set(key, []);
      g.get(key).push(n.id);
    });
  }
  return g;
};
const commands = [];
for (const [key, ids] of group("fills", FILL_MAP)) {
  const [index, color] = key.split("|");
  commands.push({ command: "fill.set", params: { ids, index: Number(index), color: FILL_MAP[color] } });
}
for (const [key, ids] of group("strokes", STROKE_MAP)) {
  const [index, color] = key.split("|");
  commands.push({ command: "stroke.set", params: { ids, index: Number(index), color: STROKE_MAP[color] } });
}
return { steps: commands.length, slots: commands.reduce((a, c) => a + c.params.ids.length, 0), result: await tools[F].batch({ commands, label: "Palet netral BMIS" }) };
```

Expected: `steps` sekitar 40, `slots` sekitar 3.200.

- [ ] **Step 2: Screenshot dan periksa**

```js
return await tools["figcraft-app"].screenshot({ ids: [4294989324], maxSize: 1400 });
```

Yang diperiksa: bullet 6x6 di sidebar masih terlihat, garis tabel tetap terbaca, header tabel abu-abu muda tidak menghilang di atas putih.

---

### Task 6: Palet aksen (biru, hijau, merah, info)

**Files:** tidak ada.

**Interfaces:**
- Consumes: `readFrames()`.
- Produces: `paintSlotsOffPalette = 0`; tombol utama biru `#0058BE`, badge sukses hijau, badge bahaya merah, chip info `#D8E2FF` / `#001A42`.

- [ ] **Step 1: Terapkan — satu batch**

```js
const F = "figcraft-app";
const FRAMES = [4294989324,4294989620,4294989912,4294990185,4294990458,4294990751,4294991014,4294991261,4294991556,4294991812,4294992078,4294992387,4294992710,4294993043,4294993361,4294993680,4294993986,4294994274,4294994562,4294994849,4294995172,4294995495,4294995730,4294995965,4294996284,4294996603,4294996919];

async function readFrames() {
  const all = [];
  for (const id of FRAMES) {
    const root = await tools[F].get_node({ id, depth: 40, maxBytes: 20000000, fields: ["name","type","fills","strokes"] });
    const walk = (n) => { all.push(n); for (const c of n.children || []) walk(c); };
    walk(root);
  }
  return all;
}

const FILL_MAP = {
  "#262626": "#0058BE",
  "#006A61": "#047857", "#006F66": "#047857", "#005049": "#047857", "#15803D": "#047857",
  "#86F2E4": "#ECFDF5", "#89F5E7": "#ECFDF5", "#DCFCE7": "#ECFDF5", "#E6F7F5": "#ECFDF5",
  "#B91C1C": "#BA1A1A", "#93000A": "#BA1A1A", "#FFDAD6": "#FEE2E2",
  "#DBE1FF": "#D8E2FF", "#003EA8": "#001A42", "#00174B": "#001A42",
};
const STROKE_MAP = {
  "#86F2E4": "#BBF7D0", "#B3EBE4": "#BBF7D0",
};

const nodes = await readFrames();
const group = (slot, map) => {
  const g = new Map();
  for (const n of nodes) {
    (n[slot] || []).forEach((p, index) => {
      if (!p || p.type !== "solid" || !map[p.color]) return;
      const key = `${index}|${p.color}`;
      if (!g.has(key)) g.set(key, []);
      g.get(key).push(n.id);
    });
  }
  return g;
};
const commands = [];
for (const [key, ids] of group("fills", FILL_MAP)) {
  const [index, color] = key.split("|");
  commands.push({ command: "fill.set", params: { ids, index: Number(index), color: FILL_MAP[color] } });
}
for (const [key, ids] of group("strokes", STROKE_MAP)) {
  const [index, color] = key.split("|");
  commands.push({ command: "stroke.set", params: { ids, index: Number(index), color: STROKE_MAP[color] } });
}
return { steps: commands.length, slots: commands.reduce((a, c) => a + c.params.ids.length, 0), result: await tools[F].batch({ commands, label: "Palet aksen BMIS" }) };
```

- [ ] **Step 2: Audit ulang — pastikan nol**

Jalankan ulang snippet audit Task 1 Step 2.
Expected: `{ textsOffFont: 0, paintSlotsOffPalette: 0 }`.

Kalau masih ada sisa, `perFrame` menunjukkan frame mana; periksa hex yang tersisa dan tambahkan ke map sebelum mengulang (sisa berarti ada warna yang belum terpetakan, bukan warna yang salah).

---

### Task 7: Verifikasi akhir, screenshot, dan commit

**Files:**
- Modify: `docs/superpowers/plans/2026-11-18-figcraft-payroll-visual-alignment.md` (angka hasil akhir)

**Interfaces:**
- Consumes: seluruh task sebelumnya.

- [ ] **Step 1: Simpan versi hasil**

```js
return await tools["figcraft-app"].run_command({
  command: "file.saveVersion",
  params: { name: "Sesudah selaras BMIS", description: "27 frame Payroll sudah memakai token BMIS" },
});
```

- [ ] **Step 2: Screenshot tujuh halaman**

```js
const pages = { "Komponen Gaji": 4294989324, "Grade Pegawai": 4294989620, "Eselon": 4294990458, "Eselon per Kantor": 4294991261, "Komponen Eselon": 4294992078, "Gaji Pokok": 4294993043, "Setup BPJS": 4294993986 };
const out = {};
for (const [name, id] of Object.entries(pages)) {
  out[name] = await tools["figcraft-app"].screenshot({ ids: [id], maxSize: 1400 });
}
return out;
```

Yang diperiksa: tidak ada teks terpotong, nav aktif biru di semua halaman, footer sidebar seragam, tidak ada warna hijau tosca/mint tersisa.

- [ ] **Step 3: Verifikasi struktur jejak**

```js
const aside = await tools["figcraft-app"].get_node({ id: 4294993988, depth: 30, fields: ["name","type","characters","visible"], maxBytes: 20000000 });
const texts = [];
const walk = (n) => { if (n.type === "TEXT" && n.visible !== false) texts.push(String(n.characters)); for (const c of n.children || []) walk(c); };
walk(aside);
return {
  adaLogout: texts.some((t) => /keluar|logout/i.test(t)),
  akses: texts.find((t) => t.startsWith("Akses")),
  aktif: texts.find((t) => t === "Aktif"),
  mappingGaji: texts.filter((t) => t === "Mapping Gaji").length,
  dashboardPayroll: texts.includes("Dashboard Payroll"),
  approvalPayroll: texts.includes("Approval Payroll"),
};
```

Expected: `{ adaLogout: false, akses: "Akses: Admin / HR", aktif: "Aktif", mappingGaji: 1, dashboardPayroll: true, approvalPayroll: true }`.

- [ ] **Step 4: Catat hasil di plan**

Tambahkan bagian ini tepat sebelum `## Yang sengaja tidak dikerjakan`.

```markdown
## Hasil eksekusi (2026-11-18)

- Baseline: textsOffFont 1845, paintSlotsOffPalette 3475.
- Akhir: textsOffFont 0, paintSlotsOffPalette 0.
- Version: "Sebelum selaras BMIS" (backup), "Sesudah selaras BMIS".
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-11-18-figcraft-payroll-visual-alignment.md
git commit -m "docs: add FigCraft payroll frame visual alignment plan"
```

---

## Yang sengaja tidak dikerjakan

- **Topbar mock tetap punya search pill dan breadcrumb.** App sudah memindahkan breadcrumb ke dalam halaman dan belum punya search global. Mengganti pill jadi ikon bell butuh operasi vektor, untungnya kecil dibanding risikonya.
- **Step bar `LANGKAH x DARI 16` dipertahankan.** Itu elemen desain yang belum ada di app; dibuang berarti kehilangan informasi urutan setup.
- **Isi tabel dan jumlah baris tidak disentuh.** Kalau nanti dibangun di Vue, data tetap dummy.
- **Halaman Vue belum dibangun.** Plan ini hanya menyelaraskan acuan visual. Memilih halaman mana yang dibangun duluan (Komponen Gaji atau lainnya) adalah plan terpisah.
- **Tiga stroke gradien `Dashed Divider Line` dibiarkan** karena bukan warna solid dan tidak masuk audit.

## Review Focus — tambahan untuk eksekutor

- Jangan menjalankan dua task sekaligus. Nomor undo dan urutan warna saling bergantung (Task 4 memakai penanda `#006A61` yang diubah Task 6).
- Kalau `batch` gagal di tengah, seluruh perubahan task itu batal; baca pesan error, perbaiki parameter, ulangi dari Step 1 task tersebut.
- `get_node` dengan `depth: 40` aman untuk semua frame di sini; tidak ada yang terpotong.
