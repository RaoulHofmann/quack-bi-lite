<template>
  <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div class="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
      <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data preview</span>
      <span class="text-xs text-gray-400">{{ rows.length }} rows | {{ columns.length }} columns</span>
    </div>
    <div class="overflow-x-auto max-h-72 overflow-y-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 sticky top-0">
          <tr>
            <th
              v-for="col in columns"
              :key="col.name"
              class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
            >
              {{ col.name }}
              <span class="text-gray-300 font-normal lowercase">({{ col.type }})</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i" class="border-t border-gray-50 even:bg-gray-50/50">
            <td
              v-for="col in columns"
              :key="col.name"
              class="px-3 py-1.5 text-gray-600 whitespace-nowrap text-xs"
            >
              {{ row[col.name] }}
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="columns.length || 1" class="px-3 py-8 text-center text-gray-400 text-sm">
              No data
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
})
</script>
