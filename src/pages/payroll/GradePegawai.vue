<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Award,
  PlusCircle,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
  X
} from 'lucide-vue-next';

interface GradeItem {
  kode: string;
  nama: string;
  urutan: number;
  golonganAsn: string;
  status: 'Aktif' | 'Nonaktif';
}

const rawItems: GradeItem[] = [
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

const searchQuery = ref('');
const statusFilter = ref<'ALL' | 'Aktif' | 'Nonaktif'>('ALL');
const currentPage = ref(1);
const perPage = 10;
const isModalOpen = ref(false);

const filteredList = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  return rawItems.filter((item) => {
    const matchSearch =
      !q ||
      item.kode.toLowerCase().includes(q) ||
      item.nama.toLowerCase().includes(q);
    const matchStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;
    return matchSearch && matchStatus;
  });
});

const totalPages = computed(() => Math.ceil(filteredList.value.length / perPage) || 1);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredList.value.slice(start, start + perPage);
});

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
});

const handleExport = () => {
  alert('Data grade pegawai berhasil disiapkan untuk diunduh.');
};
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Page Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-1" aria-label="Breadcrumb Halaman">
          <router-link to="/payroll/komponen" class="hover:text-bmis-primary transition-colors">Payroll</router-link>
          <span class="text-slate-300">&gt;</span>
          <span class="text-bmis-primary font-semibold">Grade Pegawai</span>
        </nav>
        <span class="inline-block text-[11px] font-bold text-slate-400 tracking-wider mb-1 uppercase">
          LANGKAH 2 DARI 16 • SETUP MASTER GAJI
        </span>
        <h1 class="text-2xl font-bold text-[#171C1F] tracking-tight mb-1">Grade Pegawai</h1>
        <p class="text-slate-500 text-xs mb-0">
          Tingkatan grade untuk menentukan gaji pokok dan plafon tunjangan.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="handleExport"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download :size="14" />
          <span>Ekspor Data</span>
        </button>
        <button
          type="button"
          @click="isModalOpen = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0058BE] hover:bg-[#004ba3] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle :size="14" />
          <span>Tambah Grade</span>
        </button>
      </div>
    </div>

    <!-- Main Table Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <!-- Card Header -->
      <div class="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0058BE]">
            <Award :size="18" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-slate-800">Daftar Grade Pegawai</h2>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                5 Grade Terkonfigurasi
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">Hierarki level kompensasi dasar seluruh unit kerja.</p>
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0058BE] border border-blue-200">
          <CheckCircle2 :size="13" />
          <span>Sinkronisasi Matriks Gaji</span>
        </div>
      </div>

      <!-- Toolbar: Search, Filter, Counter -->
      <div class="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <!-- Search Input -->
          <div class="relative min-w-[240px] max-w-sm flex-1">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari kode atau nama grade..."
              class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0058BE] transition-colors"
            />
          </div>

          <!-- Status Filter Dropdown -->
          <select
            v-model="statusFilter"
            class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0058BE] text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <span class="text-xs text-slate-500 font-medium">
          Menampilkan {{ paginatedList.length }} dari {{ filteredList.length }} entri
        </span>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
              <th class="px-5 py-3">KODE</th>
              <th class="px-5 py-3">NAMA GRADE</th>
              <th class="px-5 py-3 text-center">URUTAN</th>
              <th class="px-5 py-3">GOLONGAN ASN</th>
              <th class="px-5 py-3">STATUS</th>
              <th class="px-5 py-3 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in paginatedList"
              :key="item.kode"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="px-5 py-3.5 font-mono font-semibold text-slate-800">
                {{ item.kode }}
              </td>
              <td class="px-5 py-3.5 font-medium text-slate-900">
                {{ item.nama }}
              </td>
              <td class="px-5 py-3.5 text-center">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs">
                  {{ item.urutan }}
                </span>
              </td>
              <td class="px-5 py-3.5 font-mono text-slate-600">
                {{ item.golonganAsn }}
              </td>
              <td class="px-5 py-3.5">
                <span
                  v-if="item.status === 'Aktif'"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Aktif
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Nonaktif
                </span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <button
                  type="button"
                  class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Aksi"
                >
                  <MoreVertical :size="15" />
                </button>
              </td>
            </tr>

            <tr v-if="paginatedList.length === 0">
              <td colspan="6" class="px-5 py-8 text-center text-slate-400">
                Tidak ada data grade yang sesuai dengan filter.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
        <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            :disabled="currentPage === 1"
            @click="currentPage--"
            class="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
          >
            <ChevronLeft :size="13" />
            <span>Sebelumnya</span>
          </button>
          <button
            type="button"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            class="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>Selanjutnya</span>
            <ChevronRight :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- Stub Modal: Tambah Grade -->
    <div
      v-if="isModalOpen"
      role="dialog"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-800">Form Tambah Grade Pegawai</h3>
          <button
            type="button"
            @click="isModalOpen = false"
            class="text-slate-400 hover:text-slate-600 rounded-md p-1"
            aria-label="Close"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="text-xs text-slate-600 space-y-2 py-2">
          <p class="font-medium text-slate-700">Fitur form sedang dalam pengembangan (tahap setup visual).</p>
          <p class="text-slate-500">
            Form ini nantinya digunakan untuk menentukan level hierarki baru, relasi golongan ASN, dan batas nominal dasar gaji.
          </p>
        </div>

        <div class="pt-2 flex justify-end">
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
