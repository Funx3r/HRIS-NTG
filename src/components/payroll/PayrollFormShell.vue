<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Info, ArrowLeft } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle: string;
    breadcrumbParent: string;
    breadcrumbParentRoute: string;
    mode: 'tambah' | 'ubah';
    isSubmitting?: boolean;
    submitText?: string;
    calloutText?: string;
  }>(),
  {
    isSubmitting: false,
    submitText: 'Simpan',
  }
);

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel'): void;
}>();

const router = useRouter();

const handleCancel = () => {
  emit('cancel');
  router.push(props.breadcrumbParentRoute);
};
</script>

<template>
  <form @submit.prevent="emit('submit')" class="space-y-6 max-w-4xl pb-12">
    <!-- Breadcrumb & Header -->
    <div>
      <nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-2" aria-label="Breadcrumb Form">
        <router-link to="/payroll/komponen" class="hover:text-bmis-primary transition-colors">Payroll</router-link>
        <span class="text-slate-300">&gt;</span>
        <router-link :to="breadcrumbParentRoute" class="hover:text-bmis-primary transition-colors">
          {{ breadcrumbParent }}
        </router-link>
        <span class="text-slate-300">&gt;</span>
        <span class="text-bmis-primary font-semibold">{{ title }}</span>
      </nav>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span
              class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
              :class="
                mode === 'tambah'
                  ? 'bg-blue-50 text-[#0058BE] border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              "
            >
              {{ mode === 'tambah' ? 'DRAFT MODE • TAMBAH DATA' : 'MODE EDIT • PEMBARUAN DATA' }}
            </span>
          </div>
          <h1 class="text-2xl font-bold text-[#171C1F] tracking-tight mb-1">{{ title }}</h1>
          <p class="text-slate-500 text-xs mb-0">{{ subtitle }}</p>
        </div>

        <button
          type="button"
          @click="handleCancel"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft :size="14" />
          <span>Kembali</span>
        </button>
      </div>
    </div>

    <!-- Callout Box (FigCraft style) -->
    <div
      v-if="calloutText"
      class="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3"
    >
      <div class="w-6 h-6 rounded-lg bg-blue-100/80 flex items-center justify-center text-[#0058BE] shrink-0 mt-0.5">
        <Info :size="14" />
      </div>
      <p class="text-xs text-blue-900 leading-relaxed mb-0">
        {{ calloutText }}
      </p>
    </div>

    <!-- Form Content Card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
      <slot />
    </div>

    <!-- Sticky / Bottom Action Bar -->
    <div class="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        @click="handleCancel"
        class="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
      >
        Batal
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#0058BE] hover:bg-[#004ba3] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting">Menyimpan...</span>
        <span v-else>{{ submitText }}</span>
      </button>
    </div>
  </form>
</template>
