<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGradePegawaiStore } from '../../composables/useGradePegawaiStore';
import { useToast } from '../../composables/useToast';
import PayrollFormShell from '../../components/payroll/PayrollFormShell.vue';
import FormField from '../../components/payroll/FormField.vue';
import StatusSwitch from '../../components/payroll/StatusSwitch.vue';
import type { GradePegawai, PayrollStatus } from '../../types/payroll';

const route = useRoute();
const router = useRouter();
const gradeStore = useGradePegawaiStore();
const { showToast } = useToast();

const rawKode = computed(() => (route.params.kode as string) || '');
const isEdit = computed(() => !!rawKode.value);

const form = reactive<{
  kode: string;
  nama: string;
  urutan: number | string;
  golonganAsn: string;
  status: PayrollStatus;
}>({
  kode: '',
  nama: '',
  urutan: 1,
  golonganAsn: '',
  status: 'Aktif',
});

const errors = reactive<{
  kode?: string;
  nama?: string;
  urutan?: string;
  golonganAsn?: string;
}>({});

const isSubmitting = ref(false);

onMounted(async () => {
  await gradeStore.load();

  if (isEdit.value) {
    const target = gradeStore.items.value.find(
      (item) => item.kode.toLowerCase() === rawKode.value.toLowerCase()
    );

    if (!target) {
      showToast('Data tidak ditemukan.', 'error');
      router.replace('/payroll/grade');
      return;
    }

    form.kode = target.kode;
    form.nama = target.nama;
    form.urutan = target.urutan;
    form.golonganAsn = target.golonganAsn === '-' ? '' : target.golonganAsn;
    form.status = target.status;
  } else {
    // Cari urutan terbesar + 1
    const maxUrutan = gradeStore.items.value.reduce(
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
  errors.golonganAsn = undefined;

  let valid = true;

  // Validasi Kode
  const cleanKode = form.kode.trim().toUpperCase();
  if (!cleanKode) {
    errors.kode = 'Kode grade wajib diisi.';
    valid = false;
  } else if (cleanKode.length > 20) {
    errors.kode = 'Kode grade maksimal 20 karakter.';
    valid = false;
  } else if (!/^[A-Z0-9_-]+$/.test(cleanKode)) {
    errors.kode = 'Kode hanya boleh alfanumerik, garis bawah (_), atau strip (-).';
    valid = false;
  } else if (gradeStore.isKodeTaken(cleanKode, isEdit.value ? rawKode.value : undefined)) {
    errors.kode = `Kode sudah digunakan (${cleanKode}). Gunakan kode lain.`;
    valid = false;
  }

  // Validasi Nama
  const cleanNama = form.nama.trim();
  if (!cleanNama) {
    errors.nama = 'Nama grade wajib diisi.';
    valid = false;
  } else if (cleanNama.length < 3) {
    errors.nama = 'Nama grade minimal 3 karakter.';
    valid = false;
  }

  // Validasi Urutan
  const numUrutan = Number(form.urutan);
  if (!form.urutan || isNaN(numUrutan) || numUrutan < 1 || !Number.isInteger(numUrutan)) {
    errors.urutan = 'Urutan harus berupa bilangan bulat positif >= 1.';
    valid = false;
  } else if (gradeStore.isUrutanTaken(numUrutan, isEdit.value ? rawKode.value : undefined)) {
    errors.urutan = `Urutan ${numUrutan} sudah digunakan. Pilih urutan lain.`;
    valid = false;
  }

  return valid;
};

const handleSubmit = async () => {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    const payload: GradePegawai = {
      kode: form.kode.trim().toUpperCase(),
      nama: form.nama.trim(),
      urutan: Number(form.urutan),
      golonganAsn: form.golonganAsn.trim() || '-',
      status: form.status,
    };

    if (isEdit.value) {
      await gradeStore.update(rawKode.value, payload);
      showToast(`Grade ${payload.kode} berhasil diperbarui.`, 'success');
    } else {
      await gradeStore.create(payload);
      showToast(`Grade ${payload.kode} berhasil ditambahkan.`, 'success');
    }

    router.push('/payroll/grade');
  } catch (e: any) {
    showToast(e.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <PayrollFormShell
    :title="isEdit ? 'Ubah Grade' : 'Tambah Grade'"
    :subtitle="
      isEdit
        ? `Perbarui informasi dan tingkatan hierarki grade ${rawKode}.`
        : 'Tambahkan grade atau level kompensasi baru ke dalam matriks gaji.'
    "
    breadcrumb-parent="Grade Pegawai"
    breadcrumb-parent-route="/payroll/grade"
    :mode="isEdit ? 'ubah' : 'tambah'"
    :is-submitting="isSubmitting"
    :submit-text="isEdit ? 'Simpan Perubahan' : 'Simpan'"
    callout-text="Kebijakan Struktur Matriks Grade: Grade pegawai menentukan rentang gaji pokok minimum-maksimum serta plafon benefit operasional."
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Kode Grade -->
      <FormField
        id="grade-kode"
        label="Kode Grade"
        :required="true"
        hint="Maks. 20 karakter alfanumerik"
        :error="errors.kode"
      >
        <template #default="{ id, hasError }">
          <input
            :id="id"
            v-model="form.kode"
            type="text"
            placeholder="Contoh: GRADE-1"
            :disabled="isEdit"
            class="w-full px-3.5 py-2 text-xs font-mono bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] transition-colors uppercase disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
          />
        </template>
      </FormField>

      <!-- Urutan -->
      <FormField
        id="grade-urutan"
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

    <!-- Nama Formal Grade -->
    <FormField
      id="grade-nama"
      label="Nama Formal Grade"
      :required="true"
      hint="Contoh: Pelaksana Pemula, Ahli Madya"
      :error="errors.nama"
    >
      <template #default="{ id, hasError }">
        <input
          :id="id"
          v-model="form.nama"
          type="text"
          placeholder="Masukkan nama jabatan grade..."
          class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] transition-colors"
          :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
        />
      </template>
    </FormField>

    <!-- Golongan ASN -->
    <FormField
      id="grade-golongan"
      label="Golongan ASN (Opsional)"
      :required="false"
      hint="Penyetaraan golongan ASN, contoh: III/a, IV/e"
      :error="errors.golonganAsn"
    >
      <template #default="{ id, hasError }">
        <input
          :id="id"
          v-model="form.golonganAsn"
          type="text"
          placeholder="Contoh: III/a (opsional)"
          class="w-full px-3.5 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:border-[#0058BE] transition-colors"
          :class="hasError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'"
        />
      </template>
    </FormField>

    <!-- Status Switch -->
    <StatusSwitch
      v-model="form.status"
      label="Status Grade"
      description="Jika dinonaktifkan, grade ini tidak dapat digunakan untuk penyesuaian gaji pegawai baru."
    />
  </PayrollFormShell>
</template>
