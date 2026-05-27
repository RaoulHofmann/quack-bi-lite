<template>
  <div class="flex flex-col bg-gray-100" style="height:calc(100vh - 4rem)">
    <!-- Compact top bar: data & pivot controls -->
    <div class="bg-white border-b border-gray-200 shrink-0">
      <div class="flex items-center gap-2 px-4 h-9">
        <span class="text-sm font-semibold text-gray-600">Quack BI</span>
        <span class="text-xs text-gray-300">|</span>
        <span class="text-xs text-gray-400">{{ tables.length }} table{{ tables.length !== 1 ? 's' : '' }}</span>
        <span v-if="joins.length" class="text-xs text-gray-400">· {{ joins.length }} join{{ joins.length !== 1 ? 's' : '' }}</span>
        <span v-if="charts.length" class="text-xs text-gray-400">· {{ charts.length }} chart{{ charts.length !== 1 ? 's' : '' }}</span>
        <div class="flex-1"></div>
        <button @click="showDataPanel = !showDataPanel"
          class="text-xs text-gray-500 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors font-medium">
          {{ showDataPanel ? 'Hide' : 'Data & Pivot' }}
        </button>
        <button @click="showJoinConfig = !showJoinConfig"
          class="text-xs text-gray-500 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors font-medium">
          {{ showJoinConfig ? 'Hide' : 'Joins' }}
        </button>
      </div>

      <!-- Collapsible data/pivot panel -->
      <div v-if="showDataPanel" class="border-t border-gray-100 px-4 py-3 space-y-4 max-h-[45vh] overflow-y-auto">
        <!-- Data sources -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data sources</h4>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="t in tables" :key="t.name"
              class="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">{{ t.name }} ({{ t.columns.length }} cols)</span>
          </div>
        </div>

        <!-- Chart suggestions -->
        <div v-if="chartSuggestions.length">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Suggested charts</h4>
          <div class="flex flex-wrap gap-2">
            <button v-for="(s, i) in chartSuggestions" :key="'r'+i" @click="applySuggestion(s)"
              class="text-xs border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors text-left"
              :class="s.chartType === 'line' ? 'border-green-200 hover:border-green-300' : s.chartType === 'pie' ? 'border-purple-200 hover:border-purple-300' : 'border-blue-200 hover:border-blue-200'">
              <span class="block font-medium text-gray-700">{{ s.label }}</span>
              <span class="block text-gray-400 mt-0.5">{{ s.xCol }} → {{ s.agg }} of {{ s.yCol }} ({{ s.chartType }})</span>
            </button>
          </div>
        </div>

        <!-- Pivot results preview -->
        <div v-for="(pivot, pi) in sharedPivots" :key="pivot.id" class="relative bg-gray-50 border border-gray-200 rounded-lg p-3">
          <button @click="removePivot(pi)" class="absolute top-1.5 right-2 text-red-400 hover:text-red-600 text-sm leading-none">&times;</button>
          <div class="mb-1.5 text-xs text-gray-400 italic">Pivot {{ pi + 1 }}</div>
          <div class="flex items-center justify-end gap-2 mb-2">
            <button @click="addPivotChart({ label: pivot.rowCol + ' pivot', xCol: pivot.rowCol, yCol: pivot.valCol, agg: pivot.agg, chartType: 'bar' })"
              class="text-xs bg-purple-600 text-white px-2 py-0.5 rounded hover:bg-purple-700 transition-colors">
              Add chart
            </button>
          </div>
          <div class="overflow-x-auto max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
            <table class="w-full text-xs border-collapse">
              <thead class="sticky top-0 z-10">
                <tr>
                  <th class="px-2 py-1 text-left font-semibold text-gray-500 uppercase border-b bg-gray-100 whitespace-nowrap">{{ pivot.rowCol || 'Row' }}</th>
                  <th v-for="h in pivot.headers" :key="h" class="px-2 py-1 text-right font-semibold text-gray-500 uppercase border-b bg-gray-100 whitespace-nowrap">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in pivot.result" :key="ri" class="border-b border-gray-50 even:bg-gray-50/50 hover:bg-blue-50/30">
                  <td class="px-2 py-0.5 font-medium text-gray-700 whitespace-nowrap">{{ row._row }}</td>
                  <td v-for="h in pivot.headers" :key="h" class="px-2 py-0.5 text-right text-gray-600 whitespace-nowrap">{{ row[h] != null ? (typeof row[h] === 'number' ? row[h].toLocaleString() : String(row[h]).slice(0, 50)) : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Create pivot -->
        <details class="bg-gray-50 border border-gray-200 rounded-lg">
          <summary class="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 rounded-lg select-none">Create pivot table</summary>
          <div class="border-t border-gray-100">
            <PivotTable
              v-if="tables[0]"
              :selected-table="tables[0].name"
              :table-columns="tables[0]?.columns || []"
              :numeric-cols="allNumericCols"
              :run-sql="runSqlQuery"
              @add-pivot-chart="addPivotChart"
              @pivot-generated="addPivot"
            />
          </div>
        </details>
      </div>

      <!-- Collapsible join config -->
      <div v-if="showJoinConfig" class="border-t border-gray-100 px-4 py-3 space-y-3">
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Table relationships</h4>
        <svg v-if="joins.length > 0" :viewBox="'0 0 ' + joinSvgW + ' 120'" class="w-full max-w-2xl" style="height:80px">
          <defs>
            <marker id="arrowHead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#3B82F6" />
            </marker>
          </defs>
          <g v-for="(j, ji) in joins" :key="ji">
            <rect :x="20" :y="10 + ji * 28" width="140" height="22" rx="4" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
            <text :x="90" :y="25 + ji * 28" text-anchor="middle" font-size="10" fill="#1E40AF" font-weight="600">{{ j.table1 }}</text>
            <text :x="90" :y="37 + ji * 28" text-anchor="middle" font-size="8" fill="#64748B">{{ j.col1 || '?' }}</text>
            <rect :x="165" :y="12 + ji * 28" width="64" height="18" rx="9" fill="#DBEAFE" />
            <text :x="197" :y="25 + ji * 28" text-anchor="middle" font-size="8" fill="#1E40AF" font-weight="600">{{ j.type }}</text>
            <line :x1="160" :y1="21 + ji * 28" :x2="235" :y2="21 + ji * 28" stroke="#3B82F6" stroke-width="1.5" marker-end="url(#arrowHead)" />
            <rect :x="240" :y="10 + ji * 28" width="140" height="22" rx="4" fill="#F0FDF4" stroke="#10B981" stroke-width="1.5" />
            <text :x="310" :y="25 + ji * 28" text-anchor="middle" font-size="10" fill="#166534" font-weight="600">{{ j.table2 }}</text>
            <text :x="310" :y="37 + ji * 28" text-anchor="middle" font-size="8" fill="#64748B">{{ j.col2 || '?' }}</text>
          </g>
        </svg>
        <div v-for="(j, ji) in joins" :key="ji"
          class="flex items-center gap-2 text-sm flex-wrap">
          <select :value="j.table1" @change="updateJoin(ji, 'table1', $event.target.value)"
            class="border border-gray-200 rounded p-1 text-xs bg-white">
            <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
          </select>
          <span>.</span>
          <select :value="j.col1" @change="updateJoin(ji, 'col1', $event.target.value)"
            class="border border-gray-200 rounded p-1 text-xs bg-white">
            <option value="">-- column --</option>
            <option v-for="c in getColumns(j.table1)" :key="c.name" :value="c.name">{{ c.name }}</option>
          </select>
          <select :value="j.type" @change="updateJoin(ji, 'type', $event.target.value)"
            class="border border-gray-200 rounded p-1 text-xs bg-white">
            <option value="INNER">INNER JOIN</option>
            <option value="LEFT">LEFT JOIN</option>
            <option value="RIGHT">RIGHT JOIN</option>
            <option value="FULL OUTER">FULL JOIN</option>
          </select>
          <select :value="j.table2" @change="updateJoin(ji, 'table2', $event.target.value)"
            class="border border-gray-200 rounded p-1 text-xs bg-white">
            <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
          </select>
          <span>.</span>
          <select :value="j.col2" @change="updateJoin(ji, 'col2', $event.target.value)"
            class="border border-gray-200 rounded p-1 text-xs bg-white">
            <option value="">-- column --</option>
            <option v-for="c in getColumns(j.table2)" :key="c.name" :value="c.name">{{ c.name }}</option>
          </select>
          <button @click="removeJoin(ji)" class="text-red-400 hover:text-red-600 text-xs ml-1">&times;</button>
        </div>
        <button @click="addJoin" class="text-xs text-blue-600 hover:underline">+ Add join</button>
      </div>
    </div>

    <!-- ExcelCanvas fills rest -->
    <div class="flex-1 min-h-0">
      <ExcelCanvas
        :tables="tables"
        :charts="charts"
        :texts="texts"
        :columns="allColumns"
        :numeric-columns="allNumericCols"
        :available-tables="tables"
        :view-only="viewOnly"
        :joined-data="joinedData"
        :pivots="sharedPivots"
        @add-chart="addChartFromGrid"
        @add-table="addCanvasTable"
        @add-text="addTextItem"
        @auto-layout="autoLayoutCanvas"
        @toggle-view="viewOnly = !viewOnly"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDashboard } from '../../lib/useDashboard'
import ExcelCanvas from '../ExcelCanvas.vue'
import PivotTable from '../PivotTable.vue'

const {
  tables, charts, canvasTables, texts, joins, showJoinConfig, viewOnly,
  chartSuggestions,
  sharedPivots, runSqlQuery,
  allColumns, allNumericCols, joinSvgW,
  onChartUpdate, addChart, removeChart, runChartQuery,
  onTextUpdate, addTextItem, removeTextItem,
  addCanvasTable, removeCanvasTable, onTableUpdate,
  autoLayoutCanvas, fetchAllData,
  applySuggestion, updateJoin, removeJoin,
  addJoin, getColumns, addPivot, removePivot,
} = useDashboard()

const showDataPanel = ref(false)

const joinedData = ref(null)

watch(joins, async () => {
  if (joins.value.length > 0 && tables.value.length > 0) {
    try {
      joinedData.value = await fetchAllData()
    } catch {
      joinedData.value = null
    }
  } else {
    joinedData.value = null
  }
}, { deep: true })

function addChartFromGrid({ id, anchorRow, anchorCol }) {
  const chart = {
    id,
    _type: 'chart',
    title: 'Chart ' + (charts.value.length + 1),
    table: tables.value[0]?.name || '',
    xCol: '', yCol: '', agg: 'SUM', chartType: 'bar',
    sortDir: 'DESC', limit: 50, filter: '',
    anchorCell: { row: anchorRow, col: anchorCol },
    width: 420, height: 300,
    queryResult: [], resultColumns: [], chartData: null,
    cellRange: null,
    _loading: false, _error: '',
  }
  charts.value = [...charts.value, chart]
}

function addPivotChart(s) {
  const offset = 20 + charts.value.length * 30
  const chart = {
    id: (Date.now() + Math.random().toString(36).slice(2)).toString(36),
    _type: 'chart',
    title: s.label,
    table: tables.value[0]?.name || '',
    xCol: s.xCol, yCol: s.yCol, agg: s.agg, chartType: s.chartType,
    sortDir: 'DESC', limit: 50, filter: '',
    x: offset % 600, y: offset, width: 420, height: 300,
    queryResult: [], resultColumns: [], chartData: null,
    cellRange: null,
    _loading: false, _error: '',
  }
  charts.value = [...charts.value, chart]
  setTimeout(() => runChartQuery(chart), 100)
}
</script>
