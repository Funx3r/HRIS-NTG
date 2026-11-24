<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
}>();
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between">
      <label :for="id" class="block text-xs font-bold text-slate-700">
        {{ label }}
        <span v-if="required" class="text-rose-500 font-bold ml-0.5">*</span>
      </label>
      <span v-if="hint && !error" class="text-[11px] text-slate-400">
        {{ hint }}
      </span>
    </div>

    <slot :id="id" :has-error="!!error" />

    <p v-if="error" class="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1">
      {{ error }}
    </p>
  </div>
</template>
