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
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Run an SQL query</h3>
        <div class="flex items-center gap-2">
          <button @click="runQuery" :disabled="!sqlQuery.trim() || queryLoading"
            class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-40">
            {{ queryLoading ? 'Running...' : 'Run' }}
          </button>
          <button @click="resetQuery" class="text-xs text-gray-500 hover:underline">Reset</button>
        </div>
      </div>

      <div class="flex border-b border-gray-200 mb-3">
        <button @click="queryMode = 'sql'" class="px-3 py-1.5 text-xs font-medium transition-colors"
          :class="queryMode === 'sql' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'">SQL</button>
        <button @click="queryMode = 'visual'" class="px-3 py-1.5 text-xs font-medium transition-colors"
          :class="queryMode === 'visual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'">Visual</button>
      </div>

      <!-- SQL mode -->
      <textarea v-if="queryMode === 'sql'" v-model="sqlQuery" rows="2"
        class="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        :placeholder="sqlPlaceholder"></textarea>

      <!-- Visual mode -->
      <div v-if="queryMode === 'visual'" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-500 mb-1 block">Columns</label>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="col in tableColumns" :key="col.name" @click="toggleQbColumn(col.name)"
              class="text-xs rounded px-2 py-0.5 transition-colors"
              :class="qbColumns.includes(col.name) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
              {{ col.name }}
            </button>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Aggregate</label>
            <select v-model="qbAggFn" class="w-full border border-gray-200 rounded p-1.5 text-xs bg-white">
              <option value="SUM">SUM</option>
              <option value="AVG">AVG</option>
              <option value="COUNT">COUNT</option>
              <option value="MIN">MIN</option>
              <option value="MAX">MAX</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Aggregate column</label>
            <select v-model="qbAggCol" class="w-full border border-gray-200 rounded p-1.5 text-xs bg-white">
              <option value="">None</option>
              <option v-for="c in numericCols" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Group by</label>
            <select v-model="qbGroupCol" class="w-full border border-gray-200 rounded p-1.5 text-xs bg-white">
              <option value="">None</option>
              <option v-for="c in tableColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Filter column</label>
            <select v-model="qbFilterCol" class="w-full border border-gray-200 rounded p-1.5 text-xs bg-white">
              <option value="">None</option>
              <option v-for="c in tableColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Operator</label>
            <select v-model="qbFilterOp" class="w-full border border-gray-200 rounded p-1.5 text-xs bg-white">
              <option value="=">=</option>
              <option value="!=">!=</option>
              <option value="&gt;">&gt;</option>
              <option value="&lt;">&lt;</option>
              <option value="LIKE">LIKE</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Value</label>
            <input v-model="qbFilterVal" type="text" class="w-full border border-gray-200 rounded p-1.5 text-xs" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Sort column</label>
            <select v-model="qbSortCol" class="w-full border border-gray-200 rounded p-1.5 text-xs bg-white">
              <option value="">None</option>
              <option v-for="c in tableColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Direction</label>
            <select v-model="qbSortDir" class="w-full border border-gray-200 rounded p-1.5 text-xs bg-white">
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Limit</label>
            <input v-model.number="qbLimit" type="number" min="1" max="5000" class="w-full border border-gray-200 rounded p-1.5 text-xs" />
          </div>
        </div>
        <div v-if="qbGeneratedSql" class="bg-gray-50 rounded-lg p-2 border border-gray-200">
          <pre class="text-xs font-mono text-gray-600 whitespace-pre-wrap">{{ qbGeneratedSql }}</pre>
        </div>
      </div>

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
      <div v-if="queryResult.length" class="mt-2 flex items-center gap-2">
        <input v-model="tableNameInput" type="text" placeholder="Table name..."
          class="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button @click="saveQueryAsTable" :disabled="!tableNameInput.trim() || savingTable"
          class="bg-green-600 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-40 whitespace-nowrap">
          {{ savingTable ? 'Saving...' : 'Add as table' }}
        </button>
      </div>
      <p v-if="queryError" class="mt-2 text-xs text-red-500">{{ queryError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  tables: { type: Array, default: () => [] },
  fetchFullTable: { type: Function, default: async () => [] },
  runSql: { type: Function, default: async () => [] },
  addQueryResult: { type: Function, default: async () => {} },
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

const savingTable = ref(false)
const tableNameInput = ref('')

const queryMode = ref('visual')
const qbColumns = ref([])
const qbAggCol = ref('')
const qbAggFn = ref('SUM')
const qbGroupCol = ref('')
const qbFilterCol = ref('')
const qbFilterOp = ref('=')
const qbFilterVal = ref('')
const qbSortCol = ref('')
const qbSortDir = ref('DESC')
const qbLimit = ref(100)

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

const qbGeneratedSql = computed(() => {
  if (!selectedTable.value || !qbColumns.value.length) return ''
  let sql = 'SELECT "' + qbColumns.value.join('", "') + '"'
  if (qbAggCol.value && qbAggFn.value) {
    sql = 'SELECT "' + qbGroupCol.value + '", ' + qbAggFn.value + '("' + qbAggCol.value + '") AS value'
    sql += ' FROM "' + selectedTable.value + '"'
    sql += ' GROUP BY "' + qbGroupCol.value + '"'
  } else {
    sql += ' FROM "' + selectedTable.value + '"'
  }
  if (qbFilterCol.value && qbFilterVal.value) {
    const val = qbFilterOp.value === 'LIKE' ? "'%" + qbFilterVal.value + "%'" : "'" + qbFilterVal.value + "'"
    sql += ' WHERE "' + qbFilterCol.value + '" ' + qbFilterOp.value + ' ' + val
  }
  if (qbSortCol.value) sql += ' ORDER BY "' + qbSortCol.value + '" ' + qbSortDir.value
  if (qbLimit.value) sql += ' LIMIT ' + qbLimit.value
  return sql
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
  resetQueryBuilder()
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
  resetQueryBuilder()
}

function resetQueryBuilder() {
  qbColumns.value = []
  qbAggCol.value = ''
  qbAggFn.value = 'SUM'
  qbGroupCol.value = ''
  qbFilterCol.value = ''
  qbFilterOp.value = '='
  qbFilterVal.value = ''
  qbSortCol.value = ''
  qbSortDir.value = 'DESC'
  qbLimit.value = 100
}

function toggleQbColumn(name) {
  const idx = qbColumns.value.indexOf(name)
  if (idx >= 0) qbColumns.value.splice(idx, 1)
  else qbColumns.value.push(name)
}

function suggestTableName() {
  const base = 'query_result'
  let name = base
  let i = 1
  while (props.tables.find(t => t.name === name)) {
    i++
    name = base + '_' + i
  }
  return name
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
      tableNameInput.value = suggestTableName()
    }
  } catch (err) {
    queryError.value = 'Query error — check your SQL syntax and column names'
  }
  queryLoading.value = false
}

async function saveQueryAsTable() {
  const name = tableNameInput.value.trim()
  if (!name || !sqlQuery.value.trim()) return
  savingTable.value = true
  queryError.value = ''
  try {
    await props.addQueryResult(name, sqlQuery.value)
    queryResult.value = []
    queryColumns.value = []
    tableNameInput.value = ''
  } catch (err) {
    queryError.value = 'Failed to create table — name may already exist'
  }
  savingTable.value = false
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

watch(qbGeneratedSql, (newSql) => {
  if (queryMode.value === 'visual' && newSql) {
    sqlQuery.value = newSql
  }
})
</script>
