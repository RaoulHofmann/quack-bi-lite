<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4">
    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Create chart</h3>

    <!-- Data source -->
    <div class="mb-3">
      <label class="block text-xs font-medium text-gray-500 mb-1">Data source</label>
      <select v-model="selectedTable"
        class="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
      </select>
    </div>

    <!-- Row field -->
    <div class="mb-3">
      <label class="block text-xs font-medium text-gray-500 mb-1">Row field (X-axis)</label>
      <select v-model="xCol"
        class="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">-- select a column --</option>
        <option v-for="c in categoryColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
    </div>

    <!-- Value field -->
    <div class="mb-3">
      <label class="block text-xs font-medium text-gray-500 mb-1">Value field (Y-axis)</label>
      <select v-model="yCol"
        class="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">-- select a column --</option>
        <option v-for="c in numericColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
    </div>

    <!-- Aggregation -->
    <div class="mb-3">
      <label class="block text-xs font-medium text-gray-500 mb-1">Aggregation</label>
      <div class="flex gap-1 flex-wrap">
        <button v-for="agg in aggregations" :key="agg" @click="selectedAgg = agg"
          class="px-3 py-1.5 rounded text-xs font-medium transition-colors"
          :class="selectedAgg === agg ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          {{ agg }}
        </button>
      </div>
    </div>

    <!-- Filter -->
    <div class="mb-3">
      <label class="block text-xs font-medium text-gray-500 mb-1">Filter (optional)</label>
      <input v-model="filter" placeholder="e.g. Sales > 1000"
        class="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <!-- Sort & Limit -->
    <div class="flex gap-3 mb-4">
      <div class="flex-1">
        <label class="block text-xs font-medium text-gray-500 mb-1">Sort</label>
        <select v-model="sortDir"
          class="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="DESC">Descending</option>
          <option value="ASC">Ascending</option>
        </select>
      </div>
      <div class="w-24">
        <label class="block text-xs font-medium text-gray-500 mb-1">Limit</label>
        <input v-model.number="limit" type="number" min="1" max="5000"
          class="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
    </div>

    <!-- Preview button -->
    <div class="flex items-center gap-3 mb-3">
      <button @click="previewQuery" :disabled="!canQuery"
        class="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {{ previewLoading ? 'Running...' : 'Preview' }}
      </button>
      <span v-if="previewRows !== null" class="text-xs text-gray-500">
        {{ previewRows }} rows
      </span>
      <span v-if="previewError" class="text-xs text-red-500">{{ previewError }}</span>
    </div>

    <!-- Chart type picker -->
    <div v-if="previewSuccess" class="border-t border-gray-100 pt-3">
      <label class="block text-xs font-medium text-gray-500 mb-2">Create chart as:</label>
      <div class="flex flex-wrap gap-2">
        <button v-for="ct in chartTypes" :key="ct.value" @click="createChart(ct.value)"
          class="text-xs border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
          :class="'border-' + ct.color + '-200 hover:border-' + ct.color + '-300'">
          <span class="block font-medium text-gray-700">{{ ct.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tables: { type: Array, default: () => [] },
  allColumns: { type: Array, default: () => [] },
  numericColumns: { type: Array, default: () => [] },
  runSql: { type: Function, required: true },
  buildFromClause: { type: Function, required: true },
  joins: { type: Array, default: () => [] },
})

const emit = defineEmits(['create-chart'])

const aggregations = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX']
const chartTypes = [
  { label: 'Bar', value: 'bar', color: 'blue' },
  { label: 'Line', value: 'line', color: 'green' },
  { label: 'Pie', value: 'pie', color: 'purple' },
  { label: 'Doughnut', value: 'doughnut', color: 'orange' },
  { label: 'Polar', value: 'polarArea', color: 'red' },
  { label: 'Radar', value: 'radar', color: 'pink' },
]

const selectedTable = ref('')
const xCol = ref('')
const yCol = ref('')
const selectedAgg = ref('SUM')
const filter = ref('')
const sortDir = ref('DESC')
const limit = ref(50)

const previewLoading = ref(false)
const previewRows = ref(null)
const previewSuccess = ref(false)
const previewError = ref('')

const categoryColumns = computed(() => {
  const numericNames = new Set(props.numericColumns.map(c => c.name))
  return props.allColumns.filter(c => !numericNames.has(c.name))
})

const canQuery = computed(() => selectedTable.value && xCol.value && yCol.value)

async function previewQuery() {
  if (!canQuery.value) return
  previewLoading.value = true
  previewSuccess.value = false
  previewError.value = ''
  previewRows.value = null
  try {
    const from = props.buildFromClause(selectedTable.value, props.joins, props.tables)
    let sql = 'SELECT "' + xCol.value + '", ' + selectedAgg.value + '("' + yCol.value + '") AS value FROM ' + from
    if (filter.value) sql += ' WHERE ' + filter.value
    sql += ' GROUP BY "' + xCol.value + '" ORDER BY value ' + sortDir.value
    sql += ' LIMIT ' + (limit.value || 50)

    const result = await props.runSql(sql)
    previewRows.value = result.length
    previewSuccess.value = true
    if (!result.length) previewError.value = 'Query returned no results'
  } catch (err) {
    previewError.value = 'Query failed. Check your selections.'
    previewSuccess.value = false
  } finally {
    previewLoading.value = false
  }
}

function createChart(chartType) {
  emit('create-chart', {
    label: xCol.value + ' by ' + yCol.value,
    table: selectedTable.value,
    xCol: xCol.value,
    yCol: yCol.value,
    agg: selectedAgg.value,
    chartType,
    filter: filter.value,
    sortDir: sortDir.value,
    limit: limit.value || 50,
  })
}
</script>
