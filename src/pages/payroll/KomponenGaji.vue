<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Layers,
  PlusCircle,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import { useKomponenGajiStore } from '../../composables/useKomponenGajiStore';
import { useToast } from '../../composables/useToast';
import ConfirmDialog from '../../components/payroll/ConfirmDialog.vue';
import type { KomponenGaji } from '../../types/payroll';

const router = useRouter();
const { items, loading, load, deactivate } = useKomponenGajiStore();
const { showToast } = useToast();

const searchQuery = ref('');
const tipeFilter = ref<'ALL' | 'Penghasilan' | 'Beban Perusahaan' | 'Potongan'>('ALL');
const statusFilter = ref<'ALL' | 'Aktif' | 'Nonaktif'>('ALL');
const currentPage = ref(1);
const perPage = 10;

const isDeactivateOpen = ref(false);
const itemToDeactivate = ref<KomponenGaji | null>(null);

onMounted(() => {
  load();
});

const filteredList = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  return (items.value || []).filter((item) => {
    const matchSearch =
      !q ||
      item.kode.toLowerCase().includes(q) ||
      item.nama.toLowerCase().includes(q);
    const matchTipe = tipeFilter.value === 'ALL' || item.tipe === tipeFilter.value;
    const matchStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;
    return matchSearch && matchTipe && matchStatus;
  });
});

const totalPages = computed(() => Math.ceil(filteredList.value.length / perPage) || 1);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredList.value.slice(start, start + perPage);
});

watch([searchQuery, tipeFilter, statusFilter], () => {
  currentPage.value = 1;
});

const openDeactivate = (item: KomponenGaji) => {
  itemToDeactivate.value = item;
  isDeactivateOpen.value = true;
};

const confirmDeactivate = async () => {
  if (!itemToDeactivate.value) return;
  const kode = itemToDeactivate.value.kode;
  await deactivate(kode);
  isDeactivateOpen.value = false;
  showToast(`${kode} berhasil dinonaktifkan.`, 'info');
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
          <span class="text-bmis-primary font-semibold">Komponen Gaji</span>
        </nav>
        <span class="inline-block text-[11px] font-bold text-slate-400 tracking-wider mb-1 uppercase">
          LANGKAH 1 DARI 16 • SETUP MASTER GAJI
        </span>
        <h1 class="text-2xl font-bold text-[#171C1F] tracking-tight mb-1">Komponen Gaji</h1>
        <p class="text-slate-500 text-xs mb-0">
          Daftar komponen penghasilan dan potongan untuk formulasi payroll.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="router.push('/payroll/komponen/tambah')"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0058BE] hover:bg-[#004ba3] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle :size="14" />
          <span>Tambah Komponen</span>
        </button>
      </div>
    </div>

    <!-- Main Table Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <!-- Card Header -->
      <div class="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0058BE]">
            <Layers :size="18" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-slate-800">Daftar Komponen Gaji</h2>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {{ items.length }} Komponen Terkonfigurasi
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">Komponen dasar penghitungan payroll seluruh tingkatan.</p>
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 :size="13" />
          <span>Sesuai Regulasi PPh 21 TER 2024</span>
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
              placeholder="Cari kode atau nama komponen..."
              class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0058BE] transition-colors"
            />
          </div>

          <!-- Tipe Filter Dropdown -->
          <select
            v-model="tipeFilter"
            class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0058BE] text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="Penghasilan">Penghasilan</option>
            <option value="Beban Perusahaan">Beban Perusahaan</option>
            <option value="Potongan">Potongan</option>
          </select>

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
              <th class="px-5 py-3">NAMA KOMPONEN</th>
              <th class="px-5 py-3">TIPE</th>
              <th class="px-5 py-3">SIFAT</th>
              <th class="px-5 py-3">METODE HITUNG</th>
              <th class="px-5 py-3">KENA PAJAK</th>
              <th class="px-5 py-3">STATUS</th>
              <th class="px-5 py-3 text-right w-24">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="8" class="px-5 py-8 text-center text-slate-400">
                Memuat data komponen gaji...
              </td>
            </tr>

            <tr
              v-else
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
              <td class="px-5 py-3.5">
                <span
                  v-if="item.tipe === 'Penghasilan'"
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  Penghasilan
                </span>
                <span
                  v-else-if="item.tipe === 'Beban Perusahaan'"
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                >
                  Beban Perusahaan
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  Potongan
                </span>
              </td>
              <td class="px-5 py-3.5 text-slate-600">
                {{ item.sifat }}
              </td>
              <td class="px-5 py-3.5 text-slate-600">
                {{ item.metode }}
              </td>
              <td class="px-5 py-3.5">
                <span
                  v-if="item.kenaPajak"
                  class="inline-flex items-center gap-1.5 text-slate-700 font-medium"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Ya
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 text-slate-500"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  Tidak
                </span>
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
              <td class="px-5 py-3.5 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    @click="router.push(`/payroll/komponen/${item.kode}/ubah`)"
                    class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    :aria-label="`Ubah Komponen Gaji ${item.kode}`"
                  >
                    <Pencil :size="15" />
                  </button>
                  <button
                    type="button"
                    :disabled="item.status === 'Nonaktif'"
                    :title="item.status === 'Nonaktif' ? 'Sudah nonaktif' : undefined"
                    @click="openDeactivate(item)"
                    class="p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    :class="item.status === 'Nonaktif' ? 'text-slate-300' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'"
                    :aria-label="`Nonaktifkan Komponen Gaji ${item.kode}`"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && paginatedList.length === 0">
              <td colspan="8" class="px-5 py-8 text-center text-slate-400">
                Tidak ada data komponen gaji yang sesuai dengan filter.
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

    <!-- Confirm Dialog: Deactivate Komponen -->
    <ConfirmDialog
      :is-open="isDeactivateOpen"
      title="Nonaktifkan Komponen Gaji?"
      :message="`Nonaktifkan ${itemToDeactivate?.kode}? Data historis tetap tersimpan.`"
      confirm-text="Nonaktifkan"
      cancel-text="Batal"
      :danger="true"
      @confirm="confirmDeactivate"
      @cancel="isDeactivateOpen = false"
    />
  </div>
</template>
