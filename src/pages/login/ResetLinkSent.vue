<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Check } from 'lucide-vue-next';

const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-bmis-bg flex items-center justify-center px-4">
    <div class="w-full max-w-[520px] rounded-2xl border border-bmis-border bg-white p-8 text-center shadow-sm">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bmis-green-light text-bmis-success">
        <Check :size="24" />
      </div>

      <h1 class="mt-5 text-2xl font-bold text-bmis-text">Tautan Terkirim</h1>
      <p class="mt-2 text-sm text-bmis-muted">
        Kami telah mengirim tautan reset kata sandi ke email terdaftar Anda. Periksa kotak masuk atau folder spam.
      </p>

      <button
        type="button"
        class="btn-bmis btn-bmis-blue mt-6 w-full"
        @click="router.push('/login')"
      >
        Kembali ke Login
      </button>
    </div>
  </div>
</template>
