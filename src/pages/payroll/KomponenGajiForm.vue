<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useKomponenGajiStore } from '../../composables/useKomponenGajiStore';
import { useToast } from '../../composables/useToast';
import PayrollFormShell from '../../components/payroll/PayrollFormShell.vue';
import FormField from '../../components/payroll/FormField.vue';
import StatusSwitch from '../../components/payroll/StatusSwitch.vue';
import type { KomponenGaji, PayrollStatus } from '../../types/payroll';

const route = useRoute();
const router = useRouter();
const komponenStore = useKomponenGajiStore();
const { showToast } = useToast();

const rawKode = computed(() => (route.params.kode as string) || '');
const isEdit = computed(() => !!rawKode.value);

const form = reactive<{
  kode: string;
  nama: string;
  tipe: 'Penghasilan' | 'Beban Perusahaan' | 'Potongan';
  sifat: 'Tetap' | 'Sementara';
  metode: 'Nominal Tetap' | 'Persentase' | 'Per Hari' | 'Input';
  kenaPajak: boolean;
  status: PayrollStatus;
}>({
  kode: '',
  nama: '',
  tipe: 'Penghasilan',
  sifat: 'Tetap',
  metode: 'Nominal Tetap',
  kenaPajak: false,
  status: 'Aktif',
});

const errors = reactive<{
  kode?: string;
  nama?: string;
  tipe?: string;
  sifat?: string;
  metode?: string;
}>({});

const isSubmitting = ref(false);

onMounted(async () => {
  await komponenStore.load();

  if (isEdit.value) {
    const target = komponenStore.items.value.find(
      (item) => item.kode.toLowerCase() === rawKode.value.toLowerCase()
    );

    if (!target) {
      showToast('Data tidak ditemukan.', 'error');
      router.replace('/payroll/komponen');
      return;
    }

    form.kode = target.kode;
    form.nama = target.nama;
    form.tipe = target.tipe;
    form.sifat = target.sifat;
    form.metode = target.metode;
    form.kenaPajak = target.kenaPajak;
    form.status = target.status;
  }
});

const validate = (): boolean => {
  errors.kode = undefined;
  errors.nama = undefined;
  errors.tipe = undefined;
  errors.sifat = undefined;
  errors.metode = undefined;

  let valid = true;

  // Validasi Kode
  const cleanKode = form.kode.trim().toUpperCase();
  if (!cleanKode) {
    errors.kode = 'Kode komponen wajib diisi.';
    valid = false;
  } else if (cleanKode.length > 20) {
    errors.kode = 'Kode komponen maksimal 20 karakter.';
    valid = false;
  } else if (!/^[A-Z0-9_-]+$/.test(cleanKode)) {
    errors.kode = 'Kode hanya boleh alfanumerik, garis bawah (_), atau strip (-).';
    valid = false;
  } else if (komponenStore.isKodeTaken(cleanKode, isEdit.value ? rawKode.value : undefined)) {
    errors.kode = `Kode sudah digunakan (${cleanKode}). Gunakan kode lain.`;
    valid = false;
  }

  // Validasi Nama
  const cleanNama = form.nama.trim();
  if (!cleanNama) {
    errors.nama = 'Nama komponen wajib diisi.';
    valid = false;
  } else if (cleanNama.length < 3) {
    errors.nama = 'Nama komponen minimal 3 karakter.';
    valid = false;
  }

  // Validasi Dropdowns
  if (!form.tipe) {
    errors.tipe = 'Tipe komponen wajib dipilih.';
    valid = false;
  }
  if (!form.sifat) {
    errors.sifat = 'Sifat komponen wajib dipilih.';
    valid = false;
  }
  if (!form.metode) {
    errors.metode = 'Metode hitung wajib dipilih.';
    valid = false;
  }

  return valid;
};

const handleSubmit = async () => {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    const payload: KomponenGaji = {
      kode: form.kode.trim().toUpperCase(),
      nama: form.nama.trim(),
      tipe: form.tipe,
      sifat: form.sifat,
      metode: form.metode,
      kenaPajak: form.kenaPajak,
      status: form.status,
    };

    if (isEdit.value) {
      await komponenStore.update(rawKode.value, payload);
      showToast(`Komponen ${payload.kode} berhasil diperbarui.`, 'success');
    } else {
      await komponenStore.create(payload);
      showToast(`Komponen ${payload.kode} berhasil ditambahkan.`, 'success');
    }

    router.push('/payroll/komponen');
  } catch (e: any) {
    showToast(e.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <PayrollFormShell
    :title="isEdit ? 'Ubah Komponen Gaji' : 'Tambah Komponen Gaji'"
    :subtitle="
      isEdit
        ? `Perbarui formulasi dan status komponen gaji ${rawKode}.`
        : 'Tambahkan komponen penghasilan, beban perusahaan, atau potongan ke dalam formulasi payroll.'
    "
    breadcrumb-parent="Komponen Gaji"
    breadcrumb-parent-route="/payroll/komponen"
    :mode="isEdit ? 'ubah' : 'tambah'"
    :is-submitting="isSubmitting"
    :submit-text="isEdit ? 'Simpan Perubahan' : 'Simpan Komponen'"
    callout-text="Ketentuan Regulasi Komponen Payroll: Penghasilan kena pajak akan dihitung otomatis sesuai regulasi PPh 21 tarif efektif rata-rata (TER) 2024."
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Kode Komponen -->
      <FormField
        id="komponen-kode"
        label="Kode Komponen"
        :required="true"
        hint="Maks. 20 karakter alfanumerik"
        :error="errors.kode"
      >
        <template #default="{ id, hasError }">
          <input
            :id="id"
            v-model="form.kode"
            type="text"
            placeholder="Contoh: TJ_TRANSPORT"
            :disabled="isEdit"
            class="w-full px-3.5 py-2 text-xs font-mono bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] transition-colors uppercase disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
          />
        </template>
      </FormField>

      <!-- Nama Komponen -->
      <FormField
        id="komponen-nama"
        label="Nama Komponen"
        :required="true"
        hint="Contoh: Tunjangan Transportasi"
        :error="errors.nama"
      >
        <template #default="{ id, hasError }">
          <input
            :id="id"
            v-model="form.nama"
            type="text"
            placeholder="Masukkan nama lengkap komponen gaji..."
            class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] transition-colors"
            :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
          />
        </template>
      </FormField>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Tipe -->
      <FormField
        id="komponen-tipe"
        label="Tipe Komponen"
        :required="true"
        :error="errors.tipe"
      >
        <template #default="{ id, hasError }">
          <select
            :id="id"
            v-model="form.tipe"
            class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] text-slate-700 cursor-pointer"
            :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
          >
            <option value="Penghasilan">Penghasilan</option>
            <option value="Beban Perusahaan">Beban Perusahaan</option>
            <option value="Potongan">Potongan</option>
          </select>
        </template>
      </FormField>

      <!-- Sifat -->
      <FormField
        id="komponen-sifat"
        label="Sifat Komponen"
        :required="true"
        :error="errors.sifat"
      >
        <template #default="{ id, hasError }">
          <select
            :id="id"
            v-model="form.sifat"
            class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] text-slate-700 cursor-pointer"
            :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
          >
            <option value="Tetap">Tetap</option>
            <option value="Sementara">Sementara</option>
          </select>
        </template>
      </FormField>

      <!-- Metode Hitung -->
      <FormField
        id="komponen-metode"
        label="Metode Hitung"
        :required="true"
        :error="errors.metode"
      >
        <template #default="{ id, hasError }">
          <select
            :id="id"
            v-model="form.metode"
            class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] text-slate-700 cursor-pointer"
            :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
          >
            <option value="Nominal Tetap">Nominal Tetap</option>
            <option value="Persentase">Persentase</option>
            <option value="Per Hari">Per Hari</option>
            <option value="Input">Input</option>
          </select>
        </template>
      </FormField>
    </div>

    <!-- Kena Pajak Checkbox -->
    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
      <label for="komponen-pajak" class="flex items-start gap-3 cursor-pointer select-none">
        <input
          id="komponen-pajak"
          v-model="form.kenaPajak"
          type="checkbox"
          class="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0058BE] focus:ring-[#0058BE] cursor-pointer"
        />
        <div class="space-y-0.5">
          <span class="text-xs font-bold text-slate-800">Kena Pajak PPh 21</span>
          <p class="text-[11px] text-slate-500 mb-0">
            Centang opsi ini jika komponen diperhitungkan dalam basis penghasilan bruto kena pajak TER PPh 21.
          </p>
        </div>
      </label>
    </div>

    <!-- Status Switch -->
    <StatusSwitch
      v-model="form.status"
      label="Status Komponen"
      description="Jika dinonaktifkan, komponen ini tidak akan diikutsertakan dalam kalkulasi payroll periode mendatang."
    />
  </PayrollFormShell>
</template>
