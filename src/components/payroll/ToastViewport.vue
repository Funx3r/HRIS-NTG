<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';

const { toasts, removeToast } = useToast();
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-fade-in bg-white"
      :class="{
        'border-emerald-200 text-emerald-800 bg-emerald-50/90': toast.type === 'success',
        'border-rose-200 text-rose-800 bg-rose-50/90': toast.type === 'error',
        'border-blue-200 text-blue-800 bg-blue-50/90': toast.type === 'info',
      }"
    >
      <CheckCircle2 v-if="toast.type === 'success'" :size="18" class="text-emerald-600 shrink-0 mt-0.5" />
      <AlertCircle v-else-if="toast.type === 'error'" :size="18" class="text-rose-600 shrink-0 mt-0.5" />
      <Info v-else :size="18" class="text-[#0058BE] shrink-0 mt-0.5" />

      <div class="flex-1 text-xs font-medium leading-relaxed">
        {{ toast.message }}
      </div>

      <button
        type="button"
        @click="removeToast(toast.id)"
        class="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X :size="14" />
      </button>
    </div>
  </div>
</template>
