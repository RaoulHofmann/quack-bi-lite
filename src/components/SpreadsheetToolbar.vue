<template>
  <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50/50 shrink-0">
    <div class="flex items-center gap-2">
      <span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Spreadsheet</span>
      <span class="text-[10px] text-gray-400" v-if="sheetCount > 0">{{ sheetCount }} sheet{{ sheetCount !== 1 ? 's' : '' }}</span>
    </div>
    <div class="flex items-center gap-1.5">
      <button @click="$emit('add-chart')" class="bg-blue-600 text-white px-2.5 py-1 rounded text-[11px] font-medium hover:bg-blue-700">+ Chart</button>
      <button @click="$emit('add-table')" class="bg-violet-600 text-white px-2.5 py-1 rounded text-[11px] font-medium hover:bg-violet-700">+ Table</button>
      <button @click="$emit('add-text')" class="bg-gray-600 text-white px-2.5 py-1 rounded text-[11px] font-medium hover:bg-gray-700">+ Text</button>
      <div class="w-px h-4 bg-gray-200 mx-1"></div>
      <button @click="$emit('auto-layout')" class="text-[11px] border border-gray-300 rounded px-2 py-1 hover:bg-gray-100 text-gray-600">Auto</button>
      <div class="w-px h-4 bg-gray-200 mx-1"></div>
      <button @click="$emit('toggle-view')" class="text-[11px] px-2.5 py-1 rounded font-medium transition-colors bg-amber-500 text-white hover:bg-amber-600">
        Design View
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeSheet: { type: Number, default: 0 },
  sheetCount: { type: Number, default: 0 },
})

defineEmits(['toggle-view', 'add-chart', 'add-table', 'add-text', 'auto-layout'])
</script>
