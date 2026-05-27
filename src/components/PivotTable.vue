<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4">
    <template v-if="hasExternal">
      <div class="mb-2 text-xs text-gray-400 italic">Pivot results</div>
      <div class="flex items-center justify-end gap-2 mb-2">
        <button @click="$emit('add-pivot-chart', makePivotChartConfig())"
          class="text-xs bg-purple-600 text-white px-2.5 py-1 rounded hover:bg-purple-700 transition-colors">
          Add chart from pivot
        </button>
      </div>
      <div class="overflow-x-auto max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 z-10">
            <tr>
              <th v-for="(h, hi) in externalHeaders" :key="hi" class="px-2 py-1.5 text-left font-semibold text-gray-500 uppercase border-b bg-gray-100 whitespace-nowrap">{{ hi === 0 ? (externalConfig?.rowCol || 'Row') : h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in externalResult" :key="i" class="border-b border-gray-50 even:bg-gray-50/50 hover:bg-blue-50/30">
              <td v-for="(h, hi) in externalHeaders" :key="hi" class="px-2 py-1 font-medium text-gray-700 whitespace-nowrap" :class="hi === 0 ? 'text-left' : 'text-right'">{{ row[h] != null ? formatCell(row[h]) : '\u2014' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <template v-else>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pivot table</h3>
        <button @click="generatePivot" :disabled="pivotLoading || !pivotRowCol || !pivotValCol"
          class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-40">
          {{ pivotLoading ? 'Building...' : 'Generate' }}
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <label class="text-xs font-medium text-gray-500 mb-1 block">Rows</label>
          <select v-model="pivotRowCol" class="w-full border border-gray-200 rounded p-1.5 text-sm bg-white">
            <option value="">-- select --</option>
            <option v-for="c in tableColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 mb-1 block">Columns</label>
          <select v-model="pivotColCol" class="w-full border border-gray-200 rounded p-1.5 text-sm bg-white">
            <option value="">-- select --</option>
            <option v-for="c in tableColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 mb-1 block">Values</label>
          <select v-model="pivotValCol" class="w-full border border-gray-200 rounded p-1.5 text-sm bg-white">
            <option value="">-- select --</option>
            <option v-for="c in numericCols" :key="c.name" :value="c.name">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 mb-1 block">Aggregation</label>
          <select v-model="pivotAgg" class="w-full border border-gray-200 rounded p-1.5 text-sm bg-white">
            <option value="SUM">Sum</option>
            <option value="AVG">Average</option>
            <option value="COUNT">Count</option>
            <option value="MIN">Min</option>
            <option value="MAX">Max</option>
          </select>
        </div>
      </div>
      <div v-if="pivotResult.length" class="flex items-center justify-end gap-2 mb-2">
        <button @click="$emit('add-pivot-chart', makePivotChartConfig())"
          class="text-xs bg-purple-600 text-white px-2.5 py-1 rounded hover:bg-purple-700 transition-colors">
          Add chart from pivot
        </button>
      </div>
      <div v-if="pivotResult.length" class="overflow-x-auto max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 z-10">
            <tr>
              <th class="px-2 py-1.5 text-left font-semibold text-gray-500 uppercase border-b bg-gray-100 whitespace-nowrap">{{ pivotRowCol || 'Row' }}</th>
              <th v-for="h in pivotHeaders" :key="h" class="px-2 py-1.5 text-right font-semibold text-gray-500 uppercase border-b bg-gray-100 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in pivotResult" :key="i" class="border-b border-gray-50 even:bg-gray-50/50 hover:bg-blue-50/30">
              <td class="px-2 py-1 font-medium text-gray-700 whitespace-nowrap">{{ row._row }}</td>
              <td v-for="h in pivotHeaders" :key="h" class="px-2 py-1 text-right text-gray-600 whitespace-nowrap">{{ row[h] != null ? formatCell(row[h]) : '\u2014' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="pivotError" class="mt-2 text-xs text-red-500">{{ pivotError }}</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['add-pivot-chart', 'pivot-generated'])

const props = defineProps({
  selectedTable: { type: String, default: '' },
  tableColumns: { type: Array, default: () => [] },
  numericCols: { type: Array, default: () => [] },
  runSql: { type: Function, default: async () => [] },
  externalResult: { type: Array, default: null },
  externalHeaders: { type: Array, default: null },
  externalConfig: { type: Object, default: null },
})

const hasExternal = computed(() => props.externalResult && props.externalResult.length)
const pivotRowCol = ref('')
const pivotColCol = ref('')
const pivotValCol = ref('')
const pivotAgg = ref('SUM')
const pivotResult = ref([])
const pivotHeaders = ref([])
const pivotLoading = ref(false)
const pivotError = ref('')

// Initialize from external config if provided
watch(() => props.externalConfig, (cfg) => {
  if (cfg) {
    pivotRowCol.value = cfg.rowCol || ''
    pivotColCol.value = cfg.colCol || ''
    pivotValCol.value = cfg.valCol || ''
    pivotAgg.value = cfg.agg || 'SUM'
  }
}, { immediate: true })

function formatCell(v) {
  if (v == null) return '\u2014'
  if (typeof v === 'number') return v.toLocaleString()
  if (typeof v === 'bigint') return Number(v).toLocaleString()
  return String(v).slice(0, 50)
}

async function generatePivot() {
  if (!pivotRowCol.value || !pivotValCol.value || !props.selectedTable) return
  pivotLoading.value = true
  pivotError.value = ''
  pivotResult.value = []
  pivotHeaders.value = []
  try {
    const rc = '"' + pivotRowCol.value + '"'
    const cc = pivotColCol.value ? '"' + pivotColCol.value + '"' : "'total'"
    const vc = '"' + pivotValCol.value + '"'
    const agg = pivotAgg.value

    const sql = 'SELECT ' + rc + ' AS _row, ' + cc + ' AS _col, ' + agg + '(' + vc + ') AS _val' +
      ' FROM "' + props.selectedTable + '"' +
      (pivotColCol.value ? ' GROUP BY ' + rc + ', ' + cc : ' GROUP BY ' + rc) +
      ' ORDER BY _row'
    const data = await props.runSql(sql)
    if (!data.length) { pivotError.value = 'No data returned'; pivotLoading.value = false; return }

    if (pivotColCol.value) {
      const colSet = new Set(data.map(r => String(r._col)))
      pivotHeaders.value = Array.from(colSet)
      const rowMap = {}
      data.forEach(r => {
        const rowKey = String(r._row)
        if (!rowMap[rowKey]) { rowMap[rowKey] = { _row: rowKey } }
        rowMap[rowKey][String(r._col)] = r._val
      })
      pivotResult.value = Object.values(rowMap)
    } else {
      pivotHeaders.value = [agg + ' of ' + pivotValCol.value]
      pivotResult.value = data.map(r => ({ _row: String(r._row), [pivotHeaders.value[0]]: r._val }))
    }
    emit('pivot-generated', {
      rowCol: pivotRowCol.value,
      colCol: pivotColCol.value,
      valCol: pivotValCol.value,
      agg: pivotAgg.value,
      result: pivotResult.value,
      headers: pivotHeaders.value,
    })
  } catch {
    pivotError.value = 'Could not build pivot table'
  }
  pivotLoading.value = false
}

function makePivotChartConfig() {
  const label = (pivotRowCol.value || '') + ' by ' + pivotAgg.value + ' of ' + (pivotValCol.value || '')
  return {
    label: label.slice(0, 40),
    xCol: pivotRowCol.value,
    yCol: pivotValCol.value,
    agg: pivotAgg.value,
    chartType: 'bar',
    table: props.selectedTable,
  }
}
</script>
