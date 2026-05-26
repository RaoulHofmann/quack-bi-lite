<template>
  <div class="space-y-6">
    <!-- Table selector -->
    <div class="bg-white border border-gray-200 rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tables</h3>
        <span class="text-xs text-gray-400">{{ tables.length }} loaded</span>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button v-for="t in tables" :key="t.name" @click="selectTable(t.name)"
          class="text-sm rounded-lg px-3 py-1.5 transition-colors"
          :class="selectedTable === t.name ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          {{ t.fileName || t.name }}
          <span class="text-xs opacity-70 ml-1">({{ t.columns.length }} cols, {{ t.rowCount }} rows)</span>
        </button>
      </div>
    </div>

    <div v-if="selectedTable" class="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <!-- Data table -->
      <div class="xl:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">{{ selectedTable }}</h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{ displayedRows }} rows</span>
            <button @click="loadFullTable" :disabled="loadingFull"
              class="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 disabled:opacity-40">
              {{ loadingFull ? 'Loading...' : 'Load all rows' }}
            </button>
          </div>
        </div>
        <div class="overflow-x-auto max-h-[450px] overflow-y-auto">
          <table class="w-full text-sm border-collapse">
            <thead class="sticky top-0 z-10">
              <tr>
                <th v-for="col in tableColumns" :key="col.name"
                  @click="toggleSort(col.name)"
                  class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <span>{{ col.name }}</span>
                    <span class="text-gray-300 text-xs">
                      <template v-if="sortCol === col.name">{{ sortDir === 'asc' ? '↑' : '↓' }}</template>
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in paginatedRows" :key="i"
                class="border-b border-gray-50 even:bg-gray-50/50 hover:bg-blue-50/40 transition-colors">
                <td v-for="col in tableColumns" :key="col.name"
                  class="px-3 py-1.5 text-gray-600 whitespace-nowrap text-xs">
                  {{ formatCell(row[col.name]) }}
                </td>
              </tr>
              <tr v-if="!paginatedRows.length">
                <td :colspan="tableColumns.length" class="px-3 py-8 text-center text-gray-400 text-sm">No data</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="totalRows > pageSize" class="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
          <span>Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, totalRows) }} of {{ totalRows }}</span>
          <div class="flex gap-1">
            <button @click="page = Math.max(1, page - 1)" :disabled="page <= 1"
              class="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-30">Prev</button>
            <button @click="page = Math.min(maxPage, page + 1)" :disabled="page >= maxPage"
              class="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-30">Next</button>
          </div>
        </div>
      </div>

      <!-- Column panel -->
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div class="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Columns</h3>
        </div>
        <div class="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
          <div v-for="col in tableColumns" :key="col.name"
            class="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
            :class="selectedCol?.name === col.name ? 'bg-blue-50' : ''"
            @click="selectColumn(col)">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 truncate">{{ col.name }}</span>
              <span class="text-xs text-gray-400 uppercase ml-2 shrink-0">{{ shortType(col.type) }}</span>
            </div>
            <div v-if="col.profile" class="mt-1.5 space-y-0.5 text-xs text-gray-500">
              <div class="flex justify-between"><span>Non-null</span><span>{{ col.profile.nonNull }} / {{ col.profile.total }}</span></div>
              <div class="flex justify-between"><span>Unique</span><span>{{ col.profile.unique }}</span></div>
              <div v-if="col.profile.min != null" class="flex justify-between"><span>Min</span><span>{{ formatCell(col.profile.min) }}</span></div>
              <div v-if="col.profile.max != null" class="flex justify-between"><span>Max</span><span>{{ formatCell(col.profile.max) }}</span></div>
            </div>
            <div v-else class="mt-1">
              <button @click.stop="profileColumn(col)" class="text-xs text-blue-600 hover:underline">Show stats</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SQL query -->
    <div v-if="selectedTable" class="bg-white border border-gray-200 rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Run a SQL query</h3>
        <div class="flex items-center gap-2">
          <button @click="runQuery" :disabled="!sqlQuery.trim() || queryLoading"
            class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-40">
            {{ queryLoading ? 'Running...' : 'Run' }}
          </button>
          <button @click="resetQuery" class="text-xs text-gray-500 hover:underline">Reset</button>
        </div>
      </div>
      <textarea v-model="sqlQuery" rows="2"
        class="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        :placeholder="sqlPlaceholder"></textarea>
      <div v-if="queryResult.length" class="mt-3 border border-gray-200 rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 z-10">
            <tr class="bg-gray-100">
              <th v-for="col in queryColumns" :key="col" class="px-2 py-1.5 text-left font-semibold text-gray-500 uppercase border-b whitespace-nowrap">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in queryResult.slice(0, 200)" :key="i" class="border-b border-gray-50 even:bg-gray-50/50 hover:bg-blue-50/30">
              <td v-for="col in queryColumns" :key="col" class="px-2 py-1 text-gray-600 whitespace-nowrap">{{ formatCell(row[col]) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="queryResult.length > 200" class="text-xs text-gray-400 p-2 text-center bg-gray-50">Showing 200 of {{ queryResult.length }} rows</p>
      </div>
      <p v-if="queryError" class="mt-2 text-xs text-red-500">{{ queryError }}</p>
    </div>

    <!-- Pivot table -->
    <div v-if="selectedTable" class="bg-white border border-gray-200 rounded-xl p-4">
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
              <td v-for="h in pivotHeaders" :key="h" class="px-2 py-1 text-right text-gray-600 whitespace-nowrap">{{ row[h] != null ? formatCell(row[h]) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="pivotError" class="mt-2 text-xs text-red-500">{{ pivotError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const emit = defineEmits(['add-pivot-chart'])

const props = defineProps({
  tables: { type: Array, default: () => [] },
  fetchFullTable: { type: Function, default: async () => [] },
  runSql: { type: Function, default: async () => [] },
})

const selectedTable = ref('')
const selectedCol = ref(null)
const sqlQuery = ref('')
const queryResult = ref([])
const queryColumns = ref([])
const queryLoading = ref(false)
const queryError = ref('')
const loadingFull = ref(false)
const sortCol = ref('')
const sortDir = ref('asc')
const page = ref(1)
const pageSize = 50

const tableRows = ref([])
const totalRows = ref(0)

// Pivot table state
const pivotRowCol = ref('')
const pivotColCol = ref('')
const pivotValCol = ref('')
const pivotAgg = ref('SUM')
const pivotResult = ref([])
const pivotHeaders = ref([])
const pivotLoading = ref(false)
const pivotError = ref('')

const numericCols = computed(() => tableColumns.value.filter(c =>
  ['INT', 'DOUBLE', 'FLOAT', 'DECIMAL', 'BIGINT', 'SMALLINT', 'TINYINT'].some(t => c.type.toUpperCase().includes(t))
))

const sqlPlaceholder = computed(() => {
  return 'SELECT "Region", SUM("Sales") FROM "' + (selectedTable.value || 'raw_data') + '" GROUP BY "Region"'
})

const tableColumns = computed(() => {
  const t = props.tables.find(x => x.name === selectedTable.value)
  return t?.columns || []
})

const sortedRows = computed(() => {
  if (!sortCol.value) return tableRows.value
  const rows = [...tableRows.value]
  rows.sort((a, b) => {
    const va = a[sortCol.value]
    const vb = b[sortCol.value]
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'number' && typeof vb === 'number') return sortDir.value === 'asc' ? va - vb : vb - va
    return sortDir.value === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va))
  })
  return rows
})

const maxPage = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / pageSize)))

const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return sortedRows.value.slice(start, start + pageSize)
})

const displayedRows = computed(() => totalRows.value)

function shortType(type) {
  if (!type) return ''
  if (type.includes('VARCHAR')) return 'text'
  if (type.includes('INT')) return 'int'
  if (type.includes('DOUBLE') || type.includes('FLOAT') || type.includes('DECIMAL')) return 'num'
  return type.slice(0, 4)
}

function formatCell(v) {
  if (v == null) return '—'
  if (typeof v === 'number') return v.toLocaleString()
  if (typeof v === 'bigint') return Number(v).toLocaleString()
  return String(v).slice(0, 50)
}

function toggleSort(colName) {
  if (sortCol.value === colName) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = colName
    sortDir.value = 'asc'
  }
}

function selectTable(name) {
  selectedTable.value = name
  selectedCol.value = null
  sortCol.value = ''
  page.value = 1
  sqlQuery.value = 'SELECT * FROM "' + name + '" LIMIT 100'
  queryResult.value = []
  queryColumns.value = []
  queryError.value = ''
  loadPreview(name)
}

function loadPreview(name) {
  const t = props.tables.find(x => x.name === name)
  if (!t) return
  tableRows.value = t.rows || []
  totalRows.value = t.rowCount
}

async function loadFullTable() {
  if (!selectedTable.value) return
  loadingFull.value = true
  try {
    const rows = await props.fetchFullTable(selectedTable.value)
    tableRows.value = rows
    totalRows.value = rows.length
    page.value = 1
  } catch {}
  loadingFull.value = false
}

function selectColumn(col) {
  selectedCol.value = col
  if (!col.profile) profileColumn(col)
}

async function profileColumn(col) {
  const t = props.tables.find(x => x.name === selectedTable.value)
  if (!t) return
  try {
    const escaped = '"' + col.name + '"'
    const sql = 'SELECT COUNT(*) AS total, COUNT(' + escaped + ') AS non_null, COUNT(DISTINCT ' + escaped + ') AS unique_count, MIN(' + escaped + ') AS min_val, MAX(' + escaped + ') AS max_val FROM "' + t.name + '"'
    const res = await props.runSql(sql)
    if (res.length) {
      const r = res[0]
      col.profile = {
        total: r.total,
        nonNull: r.non_null,
        unique: r.unique_count,
        min: typeAwareVal(r.min_val),
        max: typeAwareVal(r.max_val),
      }
    }
  } catch {}
}

function typeAwareVal(v) {
  if (v == null) return null
  if (typeof v === 'string') {
    if (!isNaN(v) && v.trim()) return Number(v)
    return v.slice(0, 20)
  }
  return v
}

function resetQuery() {
  if (selectedTable.value) {
    sqlQuery.value = 'SELECT * FROM "' + selectedTable.value + '" LIMIT 100'
  }
  queryResult.value = []
  queryColumns.value = []
  queryError.value = ''
}

async function runQuery() {
  if (!sqlQuery.value.trim()) return
  queryLoading.value = true
  queryError.value = ''
  queryResult.value = []
  queryColumns.value = []
  try {
    const res = await props.runSql(sqlQuery.value)
    if (res.length) {
      queryColumns.value = Object.keys(res[0])
      queryResult.value = res
    }
  } catch (err) {
    queryError.value = 'Query error — check your SQL syntax and column names'
  }
  queryLoading.value = false
}

async function generatePivot() {
  if (!pivotRowCol.value || !pivotValCol.value || !selectedTable.value) return
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
      ' FROM "' + selectedTable.value + '"' +
      (pivotColCol.value ? ' GROUP BY ' + rc + ', ' + cc : ' GROUP BY ' + rc) +
      ' ORDER BY _row'
    const data = await props.runSql(sql)
    if (!data.length) { pivotError.value = 'No data returned'; pivotLoading.value = false; return }

    // Transform into pivot format
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
      // Single column pivot (just aggregation)
      pivotHeaders.value = [agg + ' of ' + pivotValCol.value]
      pivotResult.value = data.map(r => ({ _row: String(r._row), [pivotHeaders.value[0]]: r._val }))
    }
  } catch (err) {
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
    chartType: pivotColCol.value ? 'bar' : 'bar',
    table: selectedTable.value,
  }
}

onMounted(() => {
  if (props.tables.length) {
    selectTable(props.tables[0].name)
  }
})

watch(() => props.tables.length, (len) => {
  if (len && !selectedTable.value) {
    selectTable(props.tables[0].name)
  }
})
</script>
