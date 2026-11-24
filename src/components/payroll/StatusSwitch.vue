<script setup lang="ts">
import { computed } from 'vue';
import type { PayrollStatus } from '../../types/payroll';

const props = withDefaults(
  defineProps<{
    modelValue: PayrollStatus;
    disabled?: boolean;
    label?: string;
    description?: string;
  }>(),
  {
    disabled: false,
    label: 'Status Entitas',
    description: 'Tentukan apakah data ini aktif digunakan dalam sistem payroll.',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: PayrollStatus): void;
}>();

const isAktif = computed(() => props.modelValue === 'Aktif');

const toggle = () => {
  if (props.disabled) return;
  emit('update:modelValue', isAktif.value ? 'Nonaktif' : 'Aktif');
};
</script>

<template>
  <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60">
    <div class="space-y-0.5">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-800">{{ label }}</span>
        <span
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
          :class="
            isAktif
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          "
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="isAktif ? 'bg-emerald-500' : 'bg-slate-400'"
          ></span>
          {{ modelValue }}
        </span>
      </div>
      <p class="text-[11px] text-slate-500 mb-0">
        {{ description }}
      </p>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="isAktif"
      :disabled="disabled"
      @click="toggle"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0058BE] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
      :class="isAktif ? 'bg-[#0058BE]' : 'bg-slate-300'"
      aria-label="Ubah status"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
        :class="isAktif ? 'translate-x-5' : 'translate-x-0'"
      />
    </button>
  </div>
</template>
