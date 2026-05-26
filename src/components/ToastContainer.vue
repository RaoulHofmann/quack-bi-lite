<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
    <div v-for="t in toasts" :key="t.id"
      class="px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 flex items-center justify-between gap-3"
      :class="toastClass(t.type)">
      <span>{{ t.message }}</span>
      <button @click="dismissToast(t.id)" class="text-current opacity-50 hover:opacity-100 shrink-0">&times;</button>
    </div>
  </div>
</template>

<script setup>
import { useToast } from '../lib/toast'

const { toasts, dismissToast } = useToast()

function toastClass(type) {
  if (type === 'error') return 'bg-red-50 text-red-700 border-red-200'
  if (type === 'warning') return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  return 'bg-green-50 text-green-700 border-green-200'
}
</script>
