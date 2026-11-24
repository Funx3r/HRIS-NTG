<script setup lang="ts">
import { watch, onBeforeUnmount, ref, nextTick } from 'vue';
import { AlertTriangle, X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>(),
  {
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    danger: true,
  }
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const cancelButtonRef = ref<HTMLButtonElement | null>(null);

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('cancel');
  }
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      window.addEventListener('keydown', handleKeyDown);
      nextTick(() => {
        cancelButtonRef.value?.focus();
      });
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div
    v-if="isOpen"
    role="alertdialog"
    aria-modal="true"
    :aria-label="title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
  >
    <div
      class="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4 animate-scale-in"
    >
      <div class="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div
            v-if="danger"
            class="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0"
          >
            <AlertTriangle :size="18" />
          </div>
          <h3 class="text-sm font-bold text-slate-800">{{ title }}</h3>
        </div>
        <button
          type="button"
          @click="emit('cancel')"
          class="text-slate-400 hover:text-slate-600 rounded-md p-1 cursor-pointer"
          aria-label="Tutup dialog"
        >
          <X :size="16" />
        </button>
      </div>

      <div class="text-xs text-slate-600 leading-relaxed py-1">
        {{ message }}
      </div>

      <div class="pt-3 flex items-center justify-end gap-2.5">
        <button
          ref="cancelButtonRef"
          type="button"
          @click="emit('cancel')"
          class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          @click="emit('confirm')"
          class="px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
          :class="danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0058BE] hover:bg-[#004ba3]'"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
