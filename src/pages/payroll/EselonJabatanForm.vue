<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEselonStore } from '../../composables/useEselonStore';
import { useToast } from '../../composables/useToast';
import PayrollFormShell from '../../components/payroll/PayrollFormShell.vue';
import FormField from '../../components/payroll/FormField.vue';
import StatusSwitch from '../../components/payroll/StatusSwitch.vue';
import type { EselonJabatan, PayrollStatus } from '../../types/payroll';

const route = useRoute();
const router = useRouter();
const eselonStore = useEselonStore();
const { showToast } = useToast();

const rawKode = computed(() => (route.params.kode as string) || '');
const isEdit = computed(() => !!rawKode.value);

const form = reactive<{
  kode: string;
  nama: string;
  urutan: number | string;
  kategori: 'Struktural' | 'Fungsional' | 'Non-Eselon';
  status: PayrollStatus;
}>({
  kode: '',
  nama: '',
  urutan: 1,
  kategori: 'Struktural',
  status: 'Aktif',
});

const errors = reactive<{
  kode?: string;
  nama?: string;
  urutan?: string;
  kategori?: string;
}>({});

const isSubmitting = ref(false);

onMounted(async () => {
  await eselonStore.load();

  if (isEdit.value) {
    const target = eselonStore.items.value.find(
      (item) => item.kode.toLowerCase() === rawKode.value.toLowerCase()
    );

    if (!target) {
      showToast('Data tidak ditemukan.', 'error');
      router.replace('/payroll/eselon');
      return;
    }

    form.kode = target.kode;
    form.nama = target.nama;
    form.urutan = target.urutan;
    form.kategori = target.kategori;
    form.status = target.status;
  } else {
    // Cari urutan terbesar + 1 sebagai default
    const maxUrutan = eselonStore.items.value.reduce(
      (max, cur) => (cur.urutan > max ? cur.urutan : max),
      0
    );
    form.urutan = maxUrutan + 1;
  }
});

const validate = (): boolean => {
  errors.kode = undefined;
  errors.nama = undefined;
  errors.urutan = undefined;
  errors.kategori = undefined;

  let valid = true;

  // Validasi Kode
  const cleanKode = form.kode.trim().toUpperCase();
  if (!cleanKode) {
    errors.kode = 'Kode eselon wajib diisi.';
    valid = false;
  } else if (cleanKode.length > 10) {
    errors.kode = 'Kode eselon maksimal 10 karakter.';
    valid = false;
  } else if (!/^[A-Z0-9_-]+$/.test(cleanKode)) {
    errors.kode = 'Kode hanya boleh alfanumerik, garis bawah (_), atau strip (-).';
    valid = false;
  } else if (eselonStore.isKodeTaken(cleanKode, isEdit.value ? rawKode.value : undefined)) {
    errors.kode = `Kode sudah digunakan (${cleanKode}). Gunakan kode lain.`;
    valid = false;
  }

  // Validasi Nama
  const cleanNama = form.nama.trim();
  if (!cleanNama) {
    errors.nama = 'Nama eselon wajib diisi.';
    valid = false;
  } else if (cleanNama.length < 3) {
    errors.nama = 'Nama eselon minimal 3 karakter.';
    valid = false;
  }

  // Validasi Urutan
  const numUrutan = Number(form.urutan);
  if (!form.urutan || isNaN(numUrutan) || numUrutan < 1 || !Number.isInteger(numUrutan)) {
    errors.urutan = 'Urutan harus berupa bilangan bulat positif >= 1.';
    valid = false;
  } else if (eselonStore.isUrutanTaken(numUrutan, isEdit.value ? rawKode.value : undefined)) {
    errors.urutan = `Urutan ${numUrutan} sudah digunakan. Pilih urutan lain.`;
    valid = false;
  }

  // Validasi Kategori
  if (!form.kategori) {
    errors.kategori = 'Kategori eselon wajib dipilih.';
    valid = false;
  }

  return valid;
};

const handleSubmit = async () => {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    const payload: EselonJabatan = {
      kode: form.kode.trim().toUpperCase(),
      nama: form.nama.trim(),
      urutan: Number(form.urutan),
      kategori: form.kategori,
      status: form.status,
    };

    if (isEdit.value) {
      await eselonStore.update(rawKode.value, payload);
      showToast(`Eselon ${payload.kode} berhasil diperbarui.`, 'success');
    } else {
      await eselonStore.create(payload);
      showToast(`Eselon ${payload.kode} berhasil ditambahkan.`, 'success');
    }

    router.push('/payroll/eselon');
  } catch (e: any) {
    showToast(e.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <PayrollFormShell
    :title="isEdit ? 'Ubah Eselon' : 'Tambah Eselon'"
    :subtitle="
      isEdit
        ? `Perbarui informasi dan status eselon ${rawKode}.`
        : 'Tambahkan level atau eselon jabatan baru ke dalam master data hierarki.'
    "
    breadcrumb-parent="Eselon / Level Jabatan"
    breadcrumb-parent-route="/payroll/eselon"
    :mode="isEdit ? 'ubah' : 'tambah'"
    :is-submitting="isSubmitting"
    :submit-text="isEdit ? 'Simpan Perubahan' : 'Simpan Eselon'"
    callout-text="Level jabatan digunakan sebagai acuan hierarki penentuan tunjangan jabatan dan hak fasilitas pegawai."
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Kode Eselon -->
      <FormField
        id="eselon-kode"
        label="Kode Eselon"
        :required="true"
        hint="Maks. 10 karakter alfanumerik"
        :error="errors.kode"
      >
        <template #default="{ id, hasError }">
          <input
            :id="id"
            v-model="form.kode"
            type="text"
            placeholder="Contoh: ESELON-I"
            :disabled="isEdit"
            class="w-full px-3.5 py-2 text-xs font-mono bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] transition-colors uppercase disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
          />
        </template>
      </FormField>

      <!-- Urutan -->
      <FormField
        id="eselon-urutan"
        label="Urutan Hierarki"
        :required="true"
        hint="Angka bulat (1, 2, ...)"
        :error="errors.urutan"
      >
        <template #default="{ id, hasError }">
          <input
            :id="id"
            v-model.number="form.urutan"
            type="number"
            min="1"
            step="1"
            placeholder="1"
            class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] transition-colors"
            :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
          />
        </template>
      </FormField>
    </div>

    <!-- Nama Eselon -->
    <FormField
      id="eselon-nama"
      label="Nama Level Jabatan"
      :required="true"
      hint="Contoh: Direktur Utama / Pimpinan Tinggi"
      :error="errors.nama"
    >
      <template #default="{ id, hasError }">
        <input
          :id="id"
          v-model="form.nama"
          type="text"
          placeholder="Masukkan nama lengkap eselon atau level jabatan..."
          class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] transition-colors"
          :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
        />
      </template>
    </FormField>

    <!-- Kategori -->
    <FormField
      id="eselon-kategori"
      label="Kategori Eselon"
      :required="true"
      hint="Pilih jenis hierarki jabatan"
      :error="errors.kategori"
    >
      <template #default="{ id, hasError }">
        <select
          :id="id"
          v-model="form.kategori"
          class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] text-slate-700 cursor-pointer"
          :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
        >
          <option value="Struktural">Struktural</option>
          <option value="Fungsional">Fungsional</option>
          <option value="Non-Eselon">Non-Eselon</option>
        </select>
      </template>
    </FormField>

    <!-- Status Switch -->
    <StatusSwitch
      v-model="form.status"
      label="Status Eselon"
      description="Jika dinonaktifkan, eselon ini tidak dapat dipilih untuk penugasan pegawai baru."
    />
  </PayrollFormShell>
</template>
