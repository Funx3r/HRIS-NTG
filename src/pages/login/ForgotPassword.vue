<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const errorMessage = ref('');

const handleSubmit = () => {
  errorMessage.value = '';
  if (!email.value.trim()) {
    errorMessage.value = 'Email wajib diisi.';
    return;
  }
  router.push('/tautan-terkirim');
};
</script>

<template>
  <div class="min-h-screen bg-bmis-bg flex items-center justify-center px-4">
    <div class="w-full max-w-[520px] rounded-2xl border border-bmis-border bg-white p-8 shadow-sm">
      <h1 class="text-2xl font-bold text-bmis-text">Lupa Kata Sandi</h1>
      <p class="mt-1 text-sm text-bmis-muted">
        Masukkan email terdaftar. Kami akan mengirim tautan untuk mengatur ulang kata sandi Anda.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div
          v-if="errorMessage"
          role="alert"
          class="rounded-lg border border-bmis-error bg-bmis-red-light px-3.5 py-2.5 text-xs font-medium text-bmis-error-text"
        >
          {{ errorMessage }}
        </div>

        <div>
          <label for="email" class="form-label-custom">Email Terdaftar</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="nama@perusahaan.com"
            class="form-input-custom"
          />
        </div>

        <button type="submit" class="btn-bmis btn-bmis-blue w-full">
          Kirim Tautan Reset
        </button>

        <router-link
          to="/login"
          class="block text-center text-sm text-bmis-muted hover:text-bmis-text"
        >
          Batal
        </router-link>
      </form>
    </div>
  </div>
</template>
